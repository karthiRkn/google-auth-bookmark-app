// Disable prerendering for this page
export const dynamic = 'force-dynamic';

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push('/');
        return;
      }
      setUser(data.session.user);
      await fetchBookmarks(data.session.user.id);
      subscribeToBookmarks(data.session.user.id);
      setLoading(false);
    };
    checkAuth();
  }, [router, mounted]);

  const fetchBookmarks = async (userId: string) => {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setBookmarks(data || []);
  };

  const subscribeToBookmarks = (userId: string) => {
    const channel = supabase
      .channel(`bookmarks-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log('Realtime update received:', payload);
          fetchBookmarks(userId);
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !url.trim()) return;

    try {
      const { error } = await supabase.from('bookmarks').insert({
        user_id: user.id,
        title,
        url,
      });

      if (error) {
        console.error('Error adding bookmark:', error);
        return;
      }

      setTitle('');
      setUrl('');
      
      // Manually refresh bookmarks
      await fetchBookmarks(user.id);
    } catch (err) {
      console.error('Exception adding bookmark:', err);
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting bookmark:', error);
        return;
      }

      // Manually refresh bookmarks
      await fetchBookmarks(user.id);
    } catch (err) {
      console.error('Exception deleting bookmark:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Smart Bookmarks</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Bookmark</h2>
          <form onSubmit={handleAddBookmark} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Bookmark title"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              Add Bookmark
            </button>
          </form>
        </div>

        <div className="grid gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Your Bookmarks</h2>
          {bookmarks.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
              No bookmarks yet. Add one to get started!
            </div>
          ) : (
            bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-white rounded-lg shadow p-4 flex justify-between items-start hover:shadow-md transition"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{bookmark.title}</h3>
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm break-all"
                  >
                    {bookmark.url}
                  </a>
                </div>
                <button
                  onClick={() => handleDeleteBookmark(bookmark.id)}
                  className="ml-4 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
