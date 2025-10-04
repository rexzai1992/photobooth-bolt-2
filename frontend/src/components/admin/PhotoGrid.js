import React, { useState } from 'react';
import { Download, Printer, Trash2, Eye, Calendar, HardDrive } from 'lucide-react';
import { photoService } from '../../lib/supabase';

const PhotoGrid = ({ photos, onPhotoDeleted, selectedPhotos, onPhotoSelect }) => {
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [downloading, setDownloading] = useState(new Set());

  const handleDownload = async (photo) => {
    setDownloading(prev => new Set(prev).add(photo.id));
    
    try {
      const { data, filename, error } = await photoService.downloadPhoto(photo.id);
      
      if (error) {
        alert('Failed to download photo: ' + error.message);
        return;
      }

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download photo: ' + error.message);
    } finally {
      setDownloading(prev => {
        const newSet = new Set(prev);
        newSet.delete(photo.id);
        return newSet;
      });
    }
  };

  const handlePrint = (photo) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Photo - ${photo.original_filename}</title>
          <style>
            body { margin: 0; padding: 20px; text-align: center; }
            img { max-width: 100%; height: auto; }
            @media print {
              body { margin: 0; padding: 0; }
              img { width: 100%; height: auto; }
            }
          </style>
        </head>
        <body>
          <img src="${photo.file_url}" alt="${photo.original_filename}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
  };

  const handleDelete = async (photo) => {
    if (!window.confirm(`Are you sure you want to delete "${photo.original_filename}"?`)) {
      return;
    }

    const { error } = await photoService.deletePhoto(photo.id);
    
    if (error) {
      alert('Failed to delete photo: ' + error.message);
    } else {
      onPhotoDeleted(photo.id);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {photos.map((photo) => (
          <div key={photo.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* Selection checkbox */}
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={selectedPhotos.has(photo.id)}
                onChange={(e) => onPhotoSelect(photo.id, e.target.checked)}
                className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
              />
            </div>

            {/* Photo thumbnail */}
            <div className="relative group">
              <img
                src={photo.file_url}
                alt={photo.original_filename}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => setPreviewPhoto(photo)}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>

            {/* Photo info */}
            <div className="p-4">
              <div className="mb-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                  Season: {photo.season_id}
                </span>
              </div>
              
              <h3 className="font-medium text-gray-900 truncate mb-2" title={photo.original_filename}>
                {photo.original_filename}
              </h3>
              
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {formatDate(photo.generation_timestamp)}
                </div>
                <div className="flex items-center">
                  <HardDrive className="w-3 h-3 mr-1" />
                  {formatFileSize(photo.file_size)}
                </div>
                <div>
                  {photo.image_width} × {photo.image_height}px
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleDownload(photo)}
                  disabled={downloading.has(photo.id)}
                  className="flex items-center text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handlePrint(photo)}
                  className="flex items-center text-green-600 hover:text-green-800"
                  title="Print"
                >
                  <Printer className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handleDelete(photo)}
                  className="flex items-center text-red-600 hover:text-red-800"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Photo preview modal */}
      {previewPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl max-h-full bg-white rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <div>
                <h3 className="text-lg font-medium">{previewPhoto.original_filename}</h3>
                <p className="text-sm text-gray-500">Season: {previewPhoto.season_id}</p>
              </div>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <img
                src={previewPhoto.file_url}
                alt={previewPhoto.original_filename}
                className="max-w-full max-h-96 mx-auto"
              />
            </div>
            <div className="flex justify-center space-x-4 p-4 border-t bg-gray-50">
              <button
                onClick={() => handleDownload(previewPhoto)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </button>
              <button
                onClick={() => handlePrint(previewPhoto)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PhotoGrid;