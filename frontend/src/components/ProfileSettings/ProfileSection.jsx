import React, { useState, useEffect } from 'react';
import { Info } from 'lucide-react';
import { ProfileInfoTooltip } from './ProfileInfoTooltip';

export const ProfileSection = ({ refreshEnergyTarget }) => {
  // State for profile fields
  const [sex, setSex] = useState('male');
  const [birthday, setBirthday] = useState({ day: '', month: '', year: '' });
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [original, setOriginal] = useState({});
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    fetch('/api/profile', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch profile');
        return res.json();
      })
      .then(data => {
        setSex(data.profile.sex || 'male');
        let bday = { day: '', month: '', year: '' };
        if (data.profile.birthday) {
          const [year, month, day] = data.profile.birthday.split('-');
          bday = {
            day: String(Number(day)),
            month: String(Number(month)),
            year: year
          };
        }
        setBirthday(bday);
        if (data.profile.height) {
          const totalInches = data.profile.height;
          setHeightFt(Math.floor(totalInches / 12).toString());
          setHeightIn(Math.round(totalInches % 12).toString());
        } else {
          setHeightFt('');
          setHeightIn('');
        }
        setWeight(data.profile.weight ? (data.profile.weight).toFixed(1) : '');
        setBodyFat(data.profile.body_fat_percent?.toString() || '');
        setOriginal({
          sex: data.profile.sex || 'male',
          birthday: data.profile.birthday || '',
          height: data.profile.height || '',
          weight: data.profile.weight || '',
          body_fat_percent: data.profile.body_fat_percent || '',
        });
        setFetchError(null);
      })
      .catch(err => {
        setFetchError('Could not load profile.');
      });
  }, []);

  const checkShowSave = (newSex, newBirthday, newHeight, newWeight, newBodyFat) => {
    const hasChanges = (
      newSex !== original.sex ||
      newBirthday !== original.birthday ||
      Number(newHeight) !== Number(original.height) || 
      Number(newWeight) !== Number(original.weight) ||
      Number(newBodyFat) !== Number(original.body_fat_percent)
    );
    setShowSaveButton(hasChanges);
    setSaveSuccess(false);
  };

  // Handlers
  const handleSexChange = (e) => {
    setSex(e.target.value);
    checkShowSave(e.target.value, birthdayToISO(birthday), getHeightInches(), weight, bodyFat);
  };
  const handleBirthdayChange = (field, value) => {
    const newBirthday = { ...birthday, [field]: value };
    setBirthday(newBirthday);
    checkShowSave(sex, birthdayToISO(newBirthday), getHeightInches(), weight, bodyFat);
  };
  const handleHeightFt = (e) => {
    setHeightFt(e.target.value);
    checkShowSave(sex, birthdayToISO(birthday), getHeightInches(e.target.value, heightIn), weight, bodyFat);
  };
  const handleHeightIn = (e) => {
    setHeightIn(e.target.value);
    checkShowSave(sex, birthdayToISO(birthday), getHeightInches(heightFt, e.target.value), weight, bodyFat);
  };
  const handleWeight = (e) => {
    setWeight(e.target.value);
    checkShowSave(sex, birthdayToISO(birthday), getHeightInches(), e.target.value, bodyFat);
  };
  const handleBodyFat = (e) => {
    setBodyFat(e.target.value);
    checkShowSave(sex, birthdayToISO(birthday), getHeightInches(), weight, e.target.value);
  };

  // Helpers for conversions
  const getHeightInches = (ft = heightFt, inch = heightIn) => {
    const f = parseInt(ft) || 0;
    const i = parseInt(inch) || 0;
    return (f * 12 + i).toString();
  };
  const birthdayToISO = (b) => {
    if (!b.day || !b.month || !b.year) return '';
    return `${b.year.padStart(4, '0')}-${b.month.padStart(2, '0')}-${b.day.padStart(2, '0')}`;
  };

  // Save handler
  const handleSave = async () => {
    const body = {
      sex,
      birthday: birthdayToISO(birthday),
      height: parseInt(getHeightInches()),
      weight: parseFloat(weight),
      body_fat_percent: bodyFat ? parseFloat(bodyFat) : undefined,
    };
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed to update profile');
      await fetch('/api/weight-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ weight: parseFloat(weight) })
      });
      setOriginal({
        sex: body.sex,
        birthday: body.birthday,
        height: body.height,
        weight: body.weight,
        body_fat_percent: body.body_fat_percent,
      });
      setShowSaveButton(false);
      setSaveSuccess(true);
      if (refreshEnergyTarget) refreshEnergyTarget();
    } catch (err) {
      setSaveSuccess(false);
    }
  };

  // Render options for day, month, year
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = [
    { value: '1', label: 'Jan' }, { value: '2', label: 'Feb' }, { value: '3', label: 'Mar' },
    { value: '4', label: 'Apr' }, { value: '5', label: 'May' }, { value: '6', label: 'Jun' },
    { value: '7', label: 'Jul' }, { value: '8', label: 'Aug' }, { value: '9', label: 'Sep' },
    { value: '10', label: 'Oct' }, { value: '11', label: 'Nov' }, { value: '12', label: 'Dec' },
  ];
  const years = Array.from({ length: 100 }, (_, i) => (new Date().getFullYear() - i).toString());

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-800">Profile</h2>
          <button
            type="button"
            className="ml-2 text-gray-400 hover:text-gray-700 focus:outline-none"
            onClick={() => setShowTooltip(true)}
            aria-label="Show profile info"
          >
            <Info size={18} />
          </button>
        </div>
      </div>
      <ProfileInfoTooltip
        isOpen={showTooltip}
        onClose={() => setShowTooltip(false)}
        section="profile"
      />
      {fetchError && <div className="text-red-600 mb-4">{fetchError}</div>}
      <div className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Sex</label>
          <p className="text-sm text-gray-500 mb-2">
            Nutrient targets can vary based on sex. Update your profile when pregnant or breastfeeding to reconfigure your default nutrient targets.
          </p>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input type="radio" name="sex" value="male" className="form-radio h-4 w-4 text-[#c41e3a]" checked={sex === 'male'} onChange={handleSexChange} />
              <span className="ml-2">Male</span>
            </label>
            <label className="flex items-center">
              <input type="radio" name="sex" value="female" className="form-radio h-4 w-4 text-[#c41e3a]" checked={sex === 'female'} onChange={handleSexChange} />
              <span className="ml-2">Female</span>
            </label>
          </div>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Birthday</label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Day</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent" value={birthday.day} onChange={e => handleBirthdayChange('day', e.target.value)}>
                <option value="">Day</option>
                {days.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Month</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent" value={birthday.month} onChange={e => handleBirthdayChange('month', e.target.value)}>
                <option value="">Month</option>
                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Year</label>
              <select className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent" value={birthday.year} onChange={e => handleBirthdayChange('year', e.target.value)}>
                <option value="">Year</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">Height</label>
          <div className="flex items-center">
            <input type="text" value={heightFt} onChange={handleHeightFt} className="w-16 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent" />
            <span className="mx-2">ft</span>
            <input type="text" value={heightIn} onChange={handleHeightIn} className="w-16 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent" />
            <span className="mx-2">in</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Current Weight</label>
            <div className="flex items-center">
              <input type="text" value={weight} onChange={handleWeight} className="w-24 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent" />
              <span className="mx-2">lbs</span>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Body Fat %</label>
            <div className="flex items-center">
              <input type="text" value={bodyFat} onChange={handleBodyFat} className="w-24 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c41e3a] focus:border-transparent" />
              <span className="mx-2">%</span>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">BMI</label>
          <p className="text-sm text-gray-500 mb-2">
            Your BMI can't be edited as it is a function of your weight & height.
          </p>
          <div className="bg-gray-100 rounded px-3 py-2 w-24 text-gray-700">
            {/* BMI calculation could be shown here if desired */}
            {(() => {
              const hIn = parseInt(getHeightInches());
              const wLb = parseFloat(weight);
              if (!hIn || !wLb) return '';
              const wKg = wLb * 0.453592;
              const hM = hIn * 0.0254;
              const bmi = wKg / (hM * hM);
              return bmi ? bmi.toFixed(1) : '';
            })()}
          </div>
        </div>
        <div className="flex justify-end mt-4">
          {showSaveButton && (
            <button
              className="bg-[#c41e3a] text-white px-4 py-2 rounded-md hover:bg-[#a41930] transition"
              onClick={handleSave}
            >
              Save Profile
            </button>
          )}
        </div>
        {saveSuccess && (
          <div className="flex items-center text-green-600 bg-green-50 p-2 rounded my-2">
            <span>Profile saved successfully!</span>
          </div>
        )}
      </div>
    </div>
  );
};
