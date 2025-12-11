/**
 * Nickname Modal Component
 * Allows users to set/update their display name for leaderboards
 */
import { useState, useEffect } from 'react';
import { getUserNickname, setUserNickname } from '../utils/userPreferences';

interface NicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (nickname: string) => void;
  title?: string;
  description?: string;
}

export const NicknameModal: React.FC<NicknameModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title = 'Set Your Nickname',
  description = 'Choose a nickname to display on the leaderboard',
}) => {
  const [nickname, setNicknameState] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Load current nickname when modal opens
      const currentNickname = getUserNickname();
      setNicknameState(currentNickname === 'Anonymous' ? '' : currentNickname);
      setError('');
    }
  }, [isOpen]);

  const handleSave = () => {
    const trimmed = nickname.trim();

    // Validation
    if (trimmed.length === 0) {
      setError('Please enter a nickname');
      return;
    }

    if (trimmed.length < 2) {
      setError('Nickname must be at least 2 characters');
      return;
    }

    if (trimmed.length > 20) {
      setError('Nickname must be 20 characters or less');
      return;
    }

    // Check for valid characters (alphanumeric, spaces, and common symbols)
    if (!/^[a-zA-Z0-9_\- ]+$/.test(trimmed)) {
      setError('Nickname can only contain letters, numbers, spaces, hyphens, and underscores');
      return;
    }

    // Save to localStorage
    setUserNickname(trimmed);

    // Call optional callback
    if (onSave) {
      onSave(trimmed);
    }

    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-fadeIn">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {description}
          </p>
        </div>

        {/* Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nickname
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNicknameState(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter your nickname"
            maxLength={20}
            className={`w-full px-4 py-3 rounded-lg border-2 ${
              error
                ? 'border-red-500 focus:border-red-600'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
            } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none transition-colors`}
            autoFocus
          />
          {error && (
            <p className="mt-2 text-sm text-red-500">
              {error}
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {nickname.length}/20 characters
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
