'use client';

import { useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { Camera, Loader2, X } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

// Helper function to extract storage path from Firebase Storage URL
function getStoragePathFromUrl(url: string): string | null {
  try {
    // Firebase Storage URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encodedPath}?...
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
    if (pathMatch && pathMatch[1]) {
      // Decode the path (it's URL encoded)
      return decodeURIComponent(pathMatch[1]);
    }
    return null;
  } catch (error) {
    console.error('[getStoragePathFromUrl] Error parsing URL:', error);
    return null;
  }
}

interface ImageUploadProps {
  playerId: string;
  currentImageUrl?: string;
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: Error) => void;
}

export function ImageUpload({
  playerId,
  currentImageUrl,
  onUploadComplete,
  onUploadError
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  // Only use currentImageUrl if it's a valid URL (starts with http:// or https://)
  const isValidUrl = currentImageUrl && (currentImageUrl.startsWith('http://') || currentImageUrl.startsWith('https://'));
  const [previewUrl, setPreviewUrl] = useState<string | null>(isValidUrl ? currentImageUrl : null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const error = new Error('Please select an image file');
      toast.error('Please select an image file', {
        duration: 4000,
        position: 'top-center',
      });
      onUploadError?.(error);
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const error = new Error(`Image is too large (${fileSizeMB}MB). Maximum size is 10MB`);
      toast.error(`Image is too large (${fileSizeMB}MB). Maximum size is 10MB`, {
        duration: 5000,
        position: 'top-center',
      });
      onUploadError?.(error);
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    try {
      setUploading(true);

      console.log('[ImageUpload] Starting upload process');
      console.log('[ImageUpload] Current image URL:', currentImageUrl);
      console.log('[ImageUpload] Player ID:', playerId);

      // Delete ALL old images in the player's avatar folder
      console.log('[ImageUpload] Cleaning up old avatars for player:', playerId);
      try {
        const avatarFolderRef = ref(storage, `avatars/${playerId}`);
        const listResult = await listAll(avatarFolderRef);
        console.log(`[ImageUpload] Found ${listResult.items.length} old avatar(s) to delete`);

        // Delete all existing files
        const deletePromises = listResult.items.map(async (itemRef) => {
          try {
            await deleteObject(itemRef);
            console.log('[ImageUpload] ✅ Deleted:', itemRef.fullPath);
          } catch (error) {
            console.error('[ImageUpload] ❌ Failed to delete:', itemRef.fullPath, error);
          }
        });

        await Promise.all(deletePromises);
        console.log('[ImageUpload] ✅ Cleanup complete');
      } catch (error) {
        // Ignore errors during cleanup (folder might not exist yet)
        console.log('[ImageUpload] Cleanup skipped (folder may not exist):', error);
      }

      // Upload new image
      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.name}`;
      const storageRef = ref(storage, `avatars/${playerId}/${fileName}`);

      console.log('[ImageUpload] Uploading to path:', `avatars/${playerId}/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);
      console.log('[ImageUpload] ✅ Upload complete, new URL:', downloadUrl);

      toast.success('Image uploaded successfully!', {
        duration: 3000,
        position: 'top-center',
      });
      console.log('[ImageUpload] Calling onUploadComplete with new URL');
      onUploadComplete(downloadUrl);
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
      toast.error(errorMessage, {
        duration: 5000,
        position: 'top-center',
      });
      onUploadError?.(error as Error);
      // Revert preview on error
      setPreviewUrl(isValidUrl ? currentImageUrl : null);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!currentImageUrl || !isValidUrl) return;

    try {
      setUploading(true);
      const storagePath = getStoragePathFromUrl(currentImageUrl);
      if (!storagePath) {
        throw new Error('Could not extract storage path from URL');
      }
      const imageRef = ref(storage, storagePath);
      await deleteObject(imageRef);
      console.log('Successfully removed avatar:', currentImageUrl);
      setPreviewUrl(null);
      onUploadComplete('');
      toast.success('Image removed successfully', {
        duration: 2000,
        position: 'top-center',
      });
    } catch (error) {
      console.error('Remove error:', error);
      toast.error('Failed to remove image', {
        duration: 3000,
        position: 'top-center',
      });
      onUploadError?.(error as Error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        onClick={handleClick}
        className="relative w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors overflow-hidden border-4 border-white shadow-lg group"
      >
        {previewUrl ? (
          <>
            <Image
              src={previewUrl}
              alt="Profile avatar"
              fill
              className="object-cover"
            />
            {!uploading && (
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center">
                <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Camera className="w-8 h-8 text-gray-400" />
            <p className="text-xs text-gray-500">Upload Photo</p>
          </div>
        )}

        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}

        {previewUrl && !uploading && (
          <button
            onClick={handleRemove}
            className="absolute top-0 right-0 bg-red-500 rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            type="button"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-gray-500 text-center">
        Click to take photo or upload (max 10MB)
        <br />
        JPG, PNG, GIF supported
      </p>
    </div>
  );
}
