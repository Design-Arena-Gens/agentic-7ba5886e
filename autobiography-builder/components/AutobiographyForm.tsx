'use client';

import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AutobiographyData, WritingStyle, TimelineEvent } from '@/lib/types';
import { generateAutobiography } from '@/lib/ai-generator';
import { exportToPDF, exportToDOCX, generateShareableLink } from '@/lib/export';
import {
  ArrowLeft,
  Save,
  Sparkles,
  Download,
  Share2,
  Calendar,
  Plus,
  Trash2,
  FileText,
  Edit3,
} from 'lucide-react';

interface AutobiographyFormProps {
  user: User;
  onClose: () => void;
  existingData?: AutobiographyData;
}

type Step =
  | 'personal'
  | 'childhood'
  | 'education'
  | 'career'
  | 'family'
  | 'challenges'
  | 'dreams'
  | 'timeline'
  | 'customize'
  | 'generate';

export default function AutobiographyForm({
  user,
  onClose,
  existingData,
}: AutobiographyFormProps) {
  const [step, setStep] = useState<Step>('personal');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [data, setData] = useState<AutobiographyData>({
    uid: user.uid,
    personalInfo: {
      name: '',
      dob: '',
      birthplace: '',
      background: '',
    },
    childhoodMemories: '',
    education: '',
    careerAchievements: '',
    familyRelationships: '',
    challenges: '',
    dreamsFuture: '',
    timeline: [],
    customization: {
      title: 'My Life Story',
      style: 'emotional',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  useEffect(() => {
    if (existingData) {
      setData(existingData);
      setStep('generate');
    }
  }, [existingData]);

  const handleSave = async () => {
    if (!db) {
      alert('Database not initialized');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...data,
        updatedAt: new Date(),
      };

      if (existingData?.id) {
        await updateDoc(doc(db, 'autobiographies', existingData.id), dataToSave);
      } else {
        await addDoc(collection(db, 'autobiographies'), dataToSave);
      }
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving autobiography');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const story = await generateAutobiography(data, data.customization.style);
      setData({ ...data, generatedStory: story });
    } catch (error) {
      console.error('Generation error:', error);
      alert('Error generating story');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = () => {
    if (data.generatedStory) {
      exportToPDF(data, data.generatedStory);
    }
  };

  const handleExportDOCX = () => {
    if (data.generatedStory) {
      exportToDOCX(data, data.generatedStory);
    }
  };

  const addTimelineEvent = () => {
    const newEvent: TimelineEvent = {
      id: Date.now().toString(),
      year: '',
      title: '',
      description: '',
      category: 'other',
    };
    setData({
      ...data,
      timeline: [...data.timeline, newEvent],
    });
  };

  const updateTimelineEvent = (id: string, updates: Partial<TimelineEvent>) => {
    setData({
      ...data,
      timeline: data.timeline.map((event) =>
        event.id === id ? { ...event, ...updates } : event
      ),
    });
  };

  const removeTimelineEvent = (id: string) => {
    setData({
      ...data,
      timeline: data.timeline.filter((event) => event.id !== id),
    });
  };

  const steps: { key: Step; label: string; icon: any }[] = [
    { key: 'personal', label: 'Personal Info', icon: FileText },
    { key: 'childhood', label: 'Childhood', icon: FileText },
    { key: 'education', label: 'Education', icon: FileText },
    { key: 'career', label: 'Career', icon: FileText },
    { key: 'family', label: 'Family', icon: FileText },
    { key: 'challenges', label: 'Challenges', icon: FileText },
    { key: 'dreams', label: 'Dreams', icon: FileText },
    { key: 'timeline', label: 'Timeline', icon: Calendar },
    { key: 'customize', label: 'Customize', icon: Edit3 },
    { key: 'generate', label: 'Generate', icon: Sparkles },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between overflow-x-auto">
            {steps.map((s, index) => {
              const Icon = s.icon;
              const isActive = s.key === step;
              const isCompleted = index < currentStepIndex;
              return (
                <button
                  key={s.key}
                  onClick={() => setStep(s.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-600'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium hidden sm:inline">
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {step === 'personal' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Personal Information
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={data.personalInfo.name}
                  onChange={(e) =>
                    setData({
                      ...data,
                      personalInfo: { ...data.personalInfo, name: e.target.value },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={data.personalInfo.dob}
                    onChange={(e) =>
                      setData({
                        ...data,
                        personalInfo: { ...data.personalInfo, dob: e.target.value },
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Birthplace
                  </label>
                  <input
                    type="text"
                    value={data.personalInfo.birthplace}
                    onChange={(e) =>
                      setData({
                        ...data,
                        personalInfo: {
                          ...data.personalInfo,
                          birthplace: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="City, Country"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background & Early Life
                </label>
                <textarea
                  value={data.personalInfo.background}
                  onChange={(e) =>
                    setData({
                      ...data,
                      personalInfo: {
                        ...data.personalInfo,
                        background: e.target.value,
                      },
                    })
                  }
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Tell us about your family background, where you grew up..."
                />
              </div>
            </div>
          )}

          {step === 'childhood' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Childhood Memories
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share your cherished childhood memories, experiences, and moments
                  that shaped you
                </label>
                <textarea
                  value={data.childhoodMemories}
                  onChange={(e) =>
                    setData({ ...data, childhoodMemories: e.target.value })
                  }
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe your favorite childhood memories, friends, places you loved, games you played..."
                />
              </div>
            </div>
          )}

          {step === 'education' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Education Journey
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your educational path, schools, colleges, and learning
                  experiences
                </label>
                <textarea
                  value={data.education}
                  onChange={(e) => setData({ ...data, education: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Schools attended, subjects you loved, teachers who inspired you, achievements..."
                />
              </div>
            </div>
          )}

          {step === 'career' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Career & Achievements
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share your professional journey, accomplishments, and career
                  highlights
                </label>
                <textarea
                  value={data.careerAchievements}
                  onChange={(e) =>
                    setData({ ...data, careerAchievements: e.target.value })
                  }
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Jobs, promotions, projects, skills developed, recognitions received..."
                />
              </div>
            </div>
          )}

          {step === 'family' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Family & Relationships
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your family, important relationships, and people who
                  matter most
                </label>
                <textarea
                  value={data.familyRelationships}
                  onChange={(e) =>
                    setData({ ...data, familyRelationships: e.target.value })
                  }
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Family members, spouse, children, close friends, mentors..."
                />
              </div>
            </div>
          )}

          {step === 'challenges' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Life Challenges & Lessons
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share challenges you've overcome and lessons you've learned
                </label>
                <textarea
                  value={data.challenges}
                  onChange={(e) => setData({ ...data, challenges: e.target.value })}
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Difficult times, obstacles overcome, lessons learned, personal growth..."
                />
              </div>
            </div>
          )}

          {step === 'dreams' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Dreams, Beliefs & Future Goals
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Share your aspirations, beliefs, and what you hope for the future
                </label>
                <textarea
                  value={data.dreamsFuture}
                  onChange={(e) =>
                    setData({ ...data, dreamsFuture: e.target.value })
                  }
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Life philosophy, values, dreams, future plans, legacy you want to leave..."
                />
              </div>
            </div>
          )}

          {step === 'timeline' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Life Timeline
                </h2>
                <button
                  onClick={addTimelineEvent}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Event
                </button>
              </div>

              {data.timeline.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No timeline events yet</p>
                  <button
                    onClick={addTimelineEvent}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Add Your First Event
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.timeline.map((event) => (
                    <div
                      key={event.id}
                      className="border border-gray-300 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <select
                          value={event.category}
                          onChange={(e) =>
                            updateTimelineEvent(event.id, {
                              category: e.target.value as any,
                            })
                          }
                          className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="childhood">Childhood</option>
                          <option value="education">Education</option>
                          <option value="career">Career</option>
                          <option value="family">Family</option>
                          <option value="achievement">Achievement</option>
                          <option value="challenge">Challenge</option>
                          <option value="other">Other</option>
                        </select>
                        <button
                          onClick={() => removeTimelineEvent(event.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <input
                          type="text"
                          placeholder="Year"
                          value={event.year}
                          onChange={(e) =>
                            updateTimelineEvent(event.id, { year: e.target.value })
                          }
                          className="px-4 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Event Title"
                          value={event.title}
                          onChange={(e) =>
                            updateTimelineEvent(event.id, { title: e.target.value })
                          }
                          className="px-4 py-2 border border-gray-300 rounded-lg md:col-span-2"
                        />
                      </div>
                      <textarea
                        placeholder="Event Description"
                        value={event.description}
                        onChange={(e) =>
                          updateTimelineEvent(event.id, {
                            description: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'customize' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Customize Your Autobiography
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={data.customization.title}
                  onChange={(e) =>
                    setData({
                      ...data,
                      customization: {
                        ...data.customization,
                        title: e.target.value,
                      },
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="My Life Story"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Writing Style
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(['emotional', 'professional', 'simple', 'poetic'] as WritingStyle[]).map(
                    (style) => (
                      <button
                        key={style}
                        onClick={() =>
                          setData({
                            ...data,
                            customization: { ...data.customization, style },
                          })
                        }
                        className={`px-4 py-3 rounded-lg border-2 transition capitalize ${
                          data.customization.style === style
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {style}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'generate' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Generate & Export
              </h2>

              {!data.generatedStory ? (
                <div className="text-center py-12">
                  <Sparkles className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    Ready to Generate Your Story
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Click below to create your AI-generated autobiography
                  </p>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
                  >
                    {generating ? 'Generating...' : 'Generate Autobiography'}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Your Generated Story</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Regenerate
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg mb-6 max-h-96 overflow-y-auto">
                    <div className="prose max-w-none">
                      {data.generatedStory.split('\n').map((paragraph, i) => (
                        <p key={i} className="mb-4">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={handleExportPDF}
                      className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Download className="w-4 h-4" />
                      Export PDF
                    </button>
                    <button
                      onClick={handleExportDOCX}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4" />
                      Export DOCX
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={() => {
                const currentIndex = steps.findIndex((s) => s.key === step);
                if (currentIndex > 0) {
                  setStep(steps[currentIndex - 1].key);
                }
              }}
              disabled={currentStepIndex === 0}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => {
                const currentIndex = steps.findIndex((s) => s.key === step);
                if (currentIndex < steps.length - 1) {
                  setStep(steps[currentIndex + 1].key);
                }
              }}
              disabled={currentStepIndex === steps.length - 1}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
