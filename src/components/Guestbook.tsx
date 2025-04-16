'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc, query, orderBy, limit, getDocs, doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { FaUser, FaCalendarAlt, FaPaperPlane, FaHeart } from 'react-icons/fa';

interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  timestamp: string;
  likes?: number;
}

export default function Guestbook() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedEntries, setLikedEntries] = useState<Record<string, boolean>>({});

  // 방명록 데이터 로드
  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      try {
        // 로컬 스토리지에서 좋아요 상태 로드
        const storedLikes = localStorage.getItem('guestbookLikes');
        if (storedLikes) {
          setLikedEntries(JSON.parse(storedLikes));
        }
        
        // Firestore에서 방명록 데이터 가져오기
        const q = query(
          collection(db, 'guestbook'),
          orderBy('timestamp', 'desc'),
          limit(30)
        );
        
        const snapshot = await getDocs(q);
        const fetchedEntries = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            message: data.message,
            timestamp: data.timestamp?.toDate?.() 
              ? data.timestamp.toDate().toISOString() 
              : data.timestamp,
            likes: data.likes || 0
          };
        });
        
        // 로컬 스토리지에서 오프라인 데이터 가져오기
        const storedEntries = localStorage.getItem('guestbookEntries');
        let localEntries: GuestbookEntry[] = [];
        
        if (storedEntries) {
          localEntries = JSON.parse(storedEntries);
        }
        
        // 모든 데이터 병합
        const allEntries = [...fetchedEntries, ...localEntries];
        
        // 중복 제거 (ID 기준)
        const uniqueEntries = allEntries.filter((entry, index, self) => 
          index === self.findIndex(e => e.id === entry.id)
        );
        
        // 정렬 및 설정
        const sortedEntries = uniqueEntries.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setEntries(sortedEntries);
      } catch (err) {
        console.error('방명록 데이터 로드 실패:', err);
        setError('방명록 데이터를 불러오는 데 실패했습니다.');
        
        // 오류 시 로컬 데이터만 사용
        const storedEntries = localStorage.getItem('guestbookEntries');
        if (storedEntries) {
          const localEntries: GuestbookEntry[] = JSON.parse(storedEntries);
          setEntries(localEntries);
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchEntries();
  }, []);

  // 방명록 등록 처리
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !message.trim()) {
      alert('이름과 메시지를 모두 입력해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    
    // 현재 타임스탬프
    const timestamp = new Date().toISOString();
    
    try {
      // Firestore에 등록 시도
      const docRef = await addDoc(collection(db, 'guestbook'), {
        name,
        message,
        timestamp: new Date(),
        likes: 0
      });
      
      const newEntry: GuestbookEntry = {
        id: docRef.id,
        name,
        message,
        timestamp,
        likes: 0
      };
      
      // 로컬 엔트리에 추가
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      
      // 로컬 스토리지에 저장 (오프라인 지원)
      localStorage.setItem('guestbookEntries', JSON.stringify(updatedEntries));
      
      // 입력 필드 초기화
      setName('');
      setMessage('');
      
      alert('방명록에 메시지가 등록되었습니다!');
    } catch (err) {
      console.error('방명록 등록 실패:', err);
      
      // 오프라인 모드 - 로컬 스토리지에만 저장
      const newEntry: GuestbookEntry = {
        id: `local_${Date.now()}`,
        name,
        message,
        timestamp,
        likes: 0
      };
      
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      
      // 로컬 스토리지에 저장
      localStorage.setItem('guestbookEntries', JSON.stringify(updatedEntries));
      
      // 입력 필드 초기화
      setName('');
      setMessage('');
      
      alert('오프라인 모드로 방명록이 저장되었습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 좋아요 처리
  const handleLike = async (id: string) => {
    // 이미 좋아요 했는지 확인
    if (likedEntries[id]) return;
    
    // 좋아요 상태 업데이트
    const updatedLikes = { ...likedEntries, [id]: true };
    setLikedEntries(updatedLikes);
    
    // 로컬 스토리지에 저장
    localStorage.setItem('guestbookLikes', JSON.stringify(updatedLikes));
    
    // 엔트리 업데이트
    const updatedEntries = entries.map(entry => {
      if (entry.id === id) {
        return { ...entry, likes: (entry.likes || 0) + 1 };
      }
      return entry;
    });
    
    setEntries(updatedEntries);
    
    // 로컬 스토리지 엔트리 업데이트
    localStorage.setItem('guestbookEntries', JSON.stringify(updatedEntries));
    
    // Firebase 업데이트 로직
    try {
      // "local_"로 시작하는 ID는 로컬에만 저장된 엔트리
      if (!id.startsWith('local_')) {
        // Firestore의 해당 문서 참조
        const entryRef = doc(db, 'guestbook', id);
        
        // 좋아요 수 증가 업데이트
        await updateDoc(entryRef, {
          likes: increment(1)
        });
        
        console.log('Firebase에 좋아요 업데이트 완료');
      } else {
        console.log('로컬 엔트리는 Firebase에 업데이트되지 않습니다:', id);
      }
    } catch (error) {
      console.error('좋아요 업데이트 중 오류 발생:', error);
      // 오류 발생해도 UI는 이미 업데이트되어 있으므로 사용자 경험은 유지
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
        <p className="ml-2 text-indigo-700">방명록 로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-4 px-6">
        <h2 className="text-white font-semibold text-xl">방명록</h2>
        <p className="text-purple-100 text-sm">Italian Brainrot Quiz에 대한 의견을 남겨주세요</p>
      </div>
      
      {/* 방명록 작성 폼 */}
      <div className="p-6 border-b border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              이름
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={20}
              required
            />
          </div>
          
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              메시지
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="메시지를 입력하세요"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              maxLength={200}
              required
            />
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 px-4 rounded-lg flex items-center justify-center"
            disabled={isSubmitting}
          >
            <FaPaperPlane className="mr-2" />
            {isSubmitting ? '등록 중...' : '메시지 남기기'}
          </motion.button>
        </form>
      </div>
      
      {/* 방명록 목록 */}
      <div className="divide-y divide-gray-100">
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">아직 방명록이 없습니다.</p>
            <p className="text-gray-400 text-sm">첫 번째 메시지를 남겨보세요!</p>
          </div>
        ) : (
          entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    <FaUser className="text-gray-400 mr-2" />
                    <h3 className="font-medium text-gray-800">{entry.name}</h3>
                  </div>
                  <p className="my-2 text-gray-700 whitespace-pre-line">{entry.message}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <FaCalendarAlt className="mr-1" />
                    <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleLike(entry.id)}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                    likedEntries[entry.id]
                      ? 'bg-pink-100 text-pink-600'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  disabled={likedEntries[entry.id]}
                >
                  <FaHeart className={likedEntries[entry.id] ? 'text-pink-500' : 'text-gray-400'} />
                  <span>{entry.likes || 0}</span>
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
} 