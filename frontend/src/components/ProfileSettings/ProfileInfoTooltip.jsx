import React from 'react';
import { X } from 'lucide-react';



export const ProfileInfoTooltip =  ({ isOpen, onClose, section }) => {
  if (!isOpen) return null;

  const tooltipContent = {
    profile: {
      title: "Profile Information",
      content: (
        <div className="space-y-3">
          <p>Your profile information helps us calculate your nutritional needs accurately.</p>
          <h3 className="font-medium">Why we need this information:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sex affects your basal metabolic rate and nutrient requirements</li>
            <li>Age influences metabolism and recommended daily intakes</li>
            <li>Height and weight help calculate your BMI and energy needs</li>
            <li>Body fat percentage allows for more precise calculations</li>
          </ul>
          <p>All your data is stored securely and never shared with third parties.</p>
        </div>
      )
    },
    weight: {
      title: "Weight Goal Information",
      content: (
        <div className="space-y-3">
          <p>Your weight goal determines your daily calorie target.</p>
          <h3 className="font-medium">Understanding your options:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="font-medium">Lose Weight:</span> Creates a calorie deficit</li>
            <li><span className="font-medium">Maintain Weight:</span> Balances your energy intake and expenditure</li>
            <li><span className="font-medium">Gain Weight:</span> Creates a calorie surplus</li>
          </ul>
          <p>Choose a goal that matches your current needs. You can update this at any time.</p>
        </div>
      )
    },
    weight_goal_rate: {
      title: "Weight Goal Rate Information",
      content: (
        <div className="space-y-3">
          <p>The rate determines how quickly you want to lose or gain weight.</p>
          <h3 className="font-medium">Recommended rates:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><span className="font-medium">0.5 lbs/week:</span> Gentle, sustainable pace</li>
            <li><span className="font-medium">1.0 lbs/week:</span> Moderate, common for most users</li>
            <li><span className="font-medium">Custom:</span> Set your own rate (not recommended to exceed 2 lbs/week)</li>
          </ul>
          <p>Faster rates may increase muscle loss or risk of regaining weight. Choose a pace you can maintain long-term.</p>
        </div>
      )
    },
    activity: {
      title: "Activity Level Information",
      content: (
        <div className="space-y-3">
          <p>Your activity level significantly impacts your daily energy expenditure.</p>
          <h3 className="font-medium">Activity level definitions:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="font-medium">Sedentary:</span> Little or no exercise, desk job (BMR × 1.2)</li>
            <li><span className="font-medium">Lightly active:</span> Light exercise 1-3 days/week (BMR × 1.375)</li>
            <li><span className="font-medium">Moderately active:</span> Moderate exercise 3-5 days/week (BMR × 1.55)</li>
            <li><span className="font-medium">Very active:</span> Hard exercise 6-7 days/week (BMR × 1.725)</li>
            <li><span className="font-medium">Extremely active:</span> Very hard exercise, physical job or training twice a day (BMR × 1.9)</li>
          </ul>
          <p className="text-sm italic">BMR = Basal Metabolic Rate</p>
        </div>
      )
    },
    macros: {
      title: "Macro & Energy Targets Information",
      content: (
        <div className="space-y-3">
          <p>Macronutrients are the nutrients that provide energy: protein, carbohydrates, and fat.</p>
          <h3 className="font-medium">Calculation methods:</h3>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="font-medium">Ratios:</span> Sets percentages of total calories for each macro</li>
          </ul>
          <h3 className="font-medium mt-3">Energy values:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Protein: 4 calories per gram</li>
            <li>Carbohydrates: 4 calories per gram</li>
            <li>Fat: 9 calories per gram</li>
          </ul>
        </div>
      )
    },
    energy: {
      title: "Energy Expenditure Information",
      content: (
        <div className="space-y-3">
          <p>Your total daily energy expenditure (TDEE) consists of several components:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><span className="font-medium">Basal Metabolic Rate (BMR):</span> Energy your body needs at complete rest</li>
            <li><span className="font-medium">Activity Expenditure:</span> Energy used during daily activities and exercise</li>
            <li><span className="font-medium">Thermic Effect of Food (TEF):</span> Energy used to digest, absorb, and process nutrients</li>
          </ul>
          <p>We use these components to calculate your daily calorie needs accurately.</p>
          <p className="text-sm italic mt-3">When you connect activity trackers, we'll use that data instead of your baseline activity level.</p>
        </div>
      )
    },
    dietary: {
      title: "Dietary Preferences Information",
      content: (
        <div className="space-y-3">
          <p>Your dietary preferences help us personalize your meal recommendations and nutrition tracking.</p>
          <h3 className="font-medium">Dietary patterns:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Standard (omnivore)</li>
            <li>Vegetarian (no meat, may include eggs and dairy)</li>
            <li>Vegan (no animal products)</li>
            <li>Pescatarian (vegetarian plus seafood)</li>
            <li>Paleo (focuses on whole foods, excludes grains and dairy)</li>
            <li>Ketogenic (very low carb, high fat)</li>
          </ul>
          <p>Setting your preferences helps us filter food suggestions and track your adherence to your chosen diet.</p>
        </div>
      )
    },
    allergens: {
      title: "Allergens Information",
      content: (
        <div className="space-y-3">
          <p>Setting up your allergens helps us provide safer food recommendations and warnings.</p>
          <h3 className="font-medium">Common food allergens:</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Dairy</li>
            <li>Eggs</li>
            <li>Peanuts</li>
            <li>Tree nuts</li>
            <li>Shellfish</li>
            <li>Fish</li>
            <li>Wheat</li>
            <li>Soy</li>
          </ul>
          <p className="text-sm text-amber-700 font-medium mt-2">Important: While we try to identify allergens in foods, always check product labels for the most accurate information.</p>
        </div>
      )
    }
  };

  const content = tooltipContent[section] || tooltipContent.profile;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-800">{content.title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>
        <div className="px-6 py-4">
          {content.content}
        </div>
        <div className="border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-[#c41e3a] hover:bg-[#a41930] text-white rounded-md transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
