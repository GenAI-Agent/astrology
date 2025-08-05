'use client';

import { useState, useEffect } from 'react';

interface ProfileData {
  birthDate: string;
  birthTime: string;
  birthLocation: string;
  zodiacSign: string;
}

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profileData: ProfileData) => void;
  initialData?: ProfileData;
}

export default function ProfileEditModal({ isOpen, onClose, onSave, initialData }: ProfileEditModalProps) {
  const [formData, setFormData] = useState<ProfileData>({
    birthDate: '',
    birthTime: '',
    birthLocation: '',
    zodiacSign: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate zodiac sign based on birth date
    const date = new Date(formData.birthDate);
    const month = date.getMonth() + 1;
    const day = date.getDate();

    let zodiacSign = '';
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) zodiacSign = 'Aries';
    else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) zodiacSign = 'Taurus';
    else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) zodiacSign = 'Gemini';
    else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) zodiacSign = 'Cancer';
    else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) zodiacSign = 'Leo';
    else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) zodiacSign = 'Virgo';
    else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) zodiacSign = 'Libra';
    else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) zodiacSign = 'Scorpio';
    else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) zodiacSign = 'Sagittarius';
    else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) zodiacSign = 'Capricorn';
    else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) zodiacSign = 'Aquarius';
    else zodiacSign = 'Pisces';

    onSave({ ...formData, zodiacSign });
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 text-foreground flex items-center justify-center z-50">
      <div className="bg-card rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
        <h2 className="text-2xl font-serif mb-6 text-center">編輯個人資料</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">出生日期</label>
            <input
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md bg-input focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">出生時間</label>
            <input
              type="time"
              name="birthTime"
              value={formData.birthTime}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-border rounded-md bg-input focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">出生地點</label>
            <input
              type="text"
              name="birthLocation"
              value={formData.birthLocation}
              onChange={handleChange}
              placeholder="例如：台北市, 台灣"
              required
              className="w-full px-3 py-2 border border-border rounded-md bg-input focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
            >
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}