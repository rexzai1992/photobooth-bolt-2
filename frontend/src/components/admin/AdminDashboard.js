import React, { useState, useEffect } from 'react';
import { Search, ListFilter as Filter, Download, Printer, Upload, LogOut, RefreshCw } from 'lucide-react';
import { photoService, adminAuth } from '../../lib/supabase';
import PhotoGrid from './PhotoGrid';

const AdminDashboard = ({ user, onLogout }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhotos, setSelectedPhotos] = useState(new Set());
  const [filters, setFilters] = useState({
    seasonId: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0
  });

  useEffect(() => {
    loadPhotos();
  }, [filters, pagination.page]);

  const loadPhotos = async () => {
    setLoading(true);
    
    const queryFilters = {
      ...filters,
      limit: pagination.limit,
      offset: (pagination.page - 1) * pagination.limit
    };

    const { data, error } = await photoService.getPhotos(queryFilters);
    
    if (error) {
      console.error('Failed to load photos:', error);
    } else {
      setPhotos(data || []);
    }
    
    setLoading(false);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePhotoSelect = (photoId, selected) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(photoId);
      } else {
        newSet.delete(photoId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set());
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)));
    }
  };

  const handleBulkDownload = async () => {
    if (selectedPhotos.size === 0) return;

    const selectedPhotosList = photos.filter(p => selectedPhotos.has(p.id));
    
    for (const photo of selectedPhotosList) {
      try {
        const { data, filename, error } = await photoService.downloadPhoto(photo.id);
        
        if (!error && data) {
          const url = URL.createObjectURL(data);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error('Failed to download photo:', photo.original_filename, error);
      }
    }
  };

  const handleBulkPrint = () => {
    if (selectedPhotos.size === 0) return;

    const selectedPhotosList = photos.filter(p => selectedPhotos.has(p.id));
    
    const printWindow = window.open('', '_blank');
    const photosHtml = selectedPhotosList.map(photo => 
      `<div style="page-break-after: always; text-align: center; padding: 20px;">
        <h3>${photo.original_filename} (Season: ${photo.season_id})</h3>
        <img src="${photo.file_url}" style="max-width: 100%; height: auto;" />
      </div>`
    ).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Print Selected Photos</title>
          <style>
            body { margin: 0; padding: 0; }
            @media print {
              body { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          ${photosHtml}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  };

  const handleLogout = async () => {
    await adminAuth.signOut();
    onLogout();
  };

  const handlePhotoDeleted = (photoId) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      newSet.delete(photoId);
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Photo Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Welcome back, {user?.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadPhotos}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Season ID
              </label>
              <input
                type="text"
                placeholder="Filter by season..."
                value={filters.seasonId}
                onChange={(e) => handleFilterChange('seasonId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search filenames..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedPhotos.size > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-indigo-800">
                {selectedPhotos.size} photo{selectedPhotos.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex space-x-3">
                <button
                  onClick={handleBulkDownload}
                  className="flex items-center px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Selected
                </button>
                <button
                  onClick={handleBulkPrint}
                  className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Selected
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photo count and select all */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {photos.length} photo{photos.length !== 1 ? 's' : ''} found
            </span>
            {photos.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {selectedPhotos.size === photos.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>

        {/* Photo grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No photos found matching your criteria.</p>
          </div>
        ) : (
          <PhotoGrid
            photos={photos}
            onPhotoDeleted={handlePhotoDeleted}
            selectedPhotos={selectedPhotos}
            onPhotoSelect={handlePhotoSelect}
          />
        )}

        {/* Pagination */}
        {photos.length === pagination.limit && (
          <div className="flex justify-center mt-8">
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-md">
                Page {pagination.page}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;