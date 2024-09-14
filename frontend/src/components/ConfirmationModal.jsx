import React from 'react';

const ConfirmationModal = ({ show, handleClose, handleConfirm, entryType }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-1/3">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Are you sure?</h2>
        <p className="text-gray-600 mb-6">
          Do you really want to delete this {entryType}? This action cannot be undone.
        </p>
        <div className="flex justify-end">
          <button
            className="bg-gray-400 text-white px-4 py-2 rounded mr-2"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={handleConfirm}
          >
            Delete {entryType}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;