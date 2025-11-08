'use client';

import { useState, useEffect } from 'react';
import { User, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { AutobiographyData } from '@/lib/types';
import { Book, Plus, LogOut, Edit, Trash2 } from 'lucide-react';
import AutobiographyForm from './AutobiographyForm';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [autobiographies, setAutobiographies] = useState<AutobiographyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadAutobiographies();
  }, [user]);

  const loadAutobiographies = async () => {
    if (!db) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'autobiographies'),
        where('uid', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as AutobiographyData[];
      setAutobiographies(data);
    } catch (error) {
      console.error('Error loading autobiographies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;

    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;

    if (confirm('Are you sure you want to delete this autobiography?')) {
      try {
        await deleteDoc(doc(db, 'autobiographies', id));
        await loadAutobiographies();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingId(null);
    loadAutobiographies();
  };

  if (showForm) {
    const editData = editingId
      ? autobiographies.find(a => a.id === editingId)
      : undefined;
    return (
      <AutobiographyForm
        user={user}
        onClose={handleFormClose}
        existingData={editData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Book className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Autobiography Builder
                </h1>
                <p className="text-sm text-gray-600">Welcome, {user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your stories...</p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                <Plus className="w-5 h-5" />
                Create New Autobiography
              </button>
            </div>

            {autobiographies.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
                <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Autobiographies Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Start creating your life story today!
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Create Your First Story
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {autobiographies.map((auto) => (
                  <div
                    key={auto.id}
                    className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {auto.customization?.title || 'Untitled Autobiography'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {auto.personalInfo?.name || 'No name'}
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      Last updated:{' '}
                      {auto.updatedAt
                        ? new Date(auto.updatedAt).toLocaleDateString()
                        : 'Unknown'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(auto.id!)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(auto.id!)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
