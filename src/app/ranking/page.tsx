'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { TrophyIcon, StarIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/solid';
import { db } from '@/firebase/config';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import Image from 'next/image';

interface RankingItem {
  id: string;
  name: string;
  score: number;
  timestamp?: string;
  date?: string; // 호환성을 위해 유지
}

export default function Ranking() {
  const [rankings, setRankings] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
  const { characters } = useGameStore();

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      setError(null);
      
      // 1. 먼저 로컬 스토리지에서 랭킹 데이터 가져오기
      let localRankings: RankingItem[] = [];
      try {
        const storedRankings = localStorage.getItem('rankings');
        if (storedRankings) {
          localRankings = JSON.parse(storedRankings);
          console.log('로컬 스토리지에서 랭킹 데이터 로드 성공:', localRankings.length, '개');
        }
      } catch (localError) {
        console.error('로컬 스토리지에서 랭킹 데이터 로드 실패:', localError);
      }
      
      // 2. Firebase에서 랭킹 데이터 가져오기 시도
      try {
        const q = query(
          collection(db, 'rankings'),
          orderBy('score', 'desc'),
          limit(20)
        );
        
        const snapshot = await getDocs(q);
        const firestoreRankings = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            score: data.score,
            timestamp: data.timestamp?.toDate?.() ? data.timestamp.toDate().toISOString() : data.timestamp,
            date: data.timestamp?.toDate?.() ? data.timestamp.toDate().toISOString() : data.date,
          };
        });
        
        console.log('Firebase에서 랭킹 데이터 로드 성공:', firestoreRankings.length, '개');
        
        // 3. Firebase와 로컬 데이터 병합 (중복 제거)
        const combinedRankings = [...firestoreRankings];
        
        // 로컬 랭킹 중 Firebase에 없는 것만 추가
        localRankings.forEach(localRank => {
          const isDuplicate = combinedRankings.some(
            fireRank => fireRank.name === localRank.name && fireRank.score === localRank.score
          );
          
          if (!isDuplicate) {
            combinedRankings.push({
              id: localRank.id,
              name: localRank.name,
              score: localRank.score,
              timestamp: localRank.timestamp || localRank.date || new Date().toISOString(),
              date: localRank.date || localRank.timestamp || new Date().toISOString()
            });
          }
        });
        
        // 시간 필터링 적용
        let filteredRankings = combinedRankings;
        
        if (timeFilter !== 'all') {
          const now = new Date();
          const cutoffDate = new Date();
          
          if (timeFilter === 'week') {
            cutoffDate.setDate(now.getDate() - 7); // 일주일 전
          } else if (timeFilter === 'month') {
            cutoffDate.setMonth(now.getMonth() - 1); // 한 달 전
          }
          
          filteredRankings = combinedRankings.filter(item => {
            if (!item.timestamp && !item.date) return true; // 날짜 정보가 없으면 포함
            const itemDate = new Date(item.timestamp || item.date || '');
            return itemDate >= cutoffDate;
          });
        }
        
        // 정렬 및 상위 10개만 표시
        const sortedRankings = filteredRankings
          .sort((a, b) => b.score - a.score)
          .slice(0, 20);
        
        setRankings(sortedRankings);
      } catch (firebaseError) {
        console.error('Firebase 랭킹 데이터 로드 실패:', firebaseError);
        setError('Firebase 데이터 로드에 실패했습니다. 로컬 데이터만 표시합니다.');
        
        // Firebase 실패 시 로컬 데이터만 사용
        const sortedLocalRankings = localRankings
          .sort((a, b) => b.score - a.score)
          .slice(0, 20);
        
        setRankings(sortedLocalRankings);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [timeFilter]);

  if (loading) {
    return (
      <main className="min-h-screen p-4 md:p-8 pb-24 bg-gradient-to-b from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
          <p className="mt-4 text-indigo-700 font-medium">랭킹 데이터를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 pb-24 bg-gradient-to-b from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-indigo-800">
          Italian Brainrot 랭킹
        </h1>
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg"
          >
            <p className="flex items-center">
              <span className="mr-2">⚠️</span>
              <span>{error}</span>
            </p>
          </motion.div>
        )}
        
        {/* 필터 옵션 */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-white rounded-lg shadow-sm p-1">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${timeFilter === 'all' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              전체
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${timeFilter === 'month' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              이번 달
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
                ${timeFilter === 'week' ? 'bg-indigo-100 text-indigo-800' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              이번 주
            </button>
          </div>
        </div>
        
        {/* 랭킹 목록 */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 py-4 px-6">
            <h2 className="text-white font-semibold">순위표</h2>
          </div>
          
          {rankings.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {rankings.map((item, index) => (
                <motion.div
                  key={item.id || `local-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`p-4 hover:bg-gray-50 transition-colors
                    ${index < 3 ? 'border-l-4' : ''}
                    ${index === 0 ? 'border-yellow-400' : 
                      index === 1 ? 'border-gray-400' : 
                      index === 2 ? 'border-amber-600' : ''}
                  `}
                >
                  <div className="flex items-center">
                    <div className={`w-10 h-10 flex items-center justify-center rounded-full mr-4
                      ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                        index === 1 ? 'bg-gray-100 text-gray-800' : 
                        index === 2 ? 'bg-amber-100 text-amber-800' : 
                        'bg-indigo-50 text-indigo-600'}`}
                    >
                      {index < 3 ? (
                        <span className="font-bold">{index + 1}</span>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className={`${
                          index < 3 
                            ? 'text-lg font-semibold text-indigo-900' 
                            : 'font-medium text-gray-800'
                        }`}>
                          {item.name}
                        </h3>
                        {index < 3 && (
                          <div className={`ml-2 px-2 py-0.5 text-xs rounded-full
                            ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                              index === 1 ? 'bg-gray-100 text-gray-700' : 
                              'bg-amber-100 text-amber-800'}`}
                          >
                            {index === 0 ? '👑 1등' : index === 1 ? '🥈 2등' : '🥉 3등'}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 flex items-center mt-0.5">
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        {item.timestamp || item.date ? 
                          new Date(item.timestamp || item.date || '').toLocaleDateString() : 
                          '날짜 정보 없음'}
                      </p>
                    </div>
                    
                    <div className={`flex items-center ${
                      index < 3 ? 'bg-gradient-to-r from-indigo-50 to-purple-50' : 'bg-gray-50'
                    } px-4 py-2 rounded-lg`}>
                      {index < 3 ? (
                        <TrophyIcon className={`w-5 h-5 mr-2 ${
                          index === 0 ? 'text-yellow-500' :
                          index === 1 ? 'text-gray-400' :
                          'text-amber-600'
                        }`} />
                      ) : (
                        <StarIcon className="w-5 h-5 mr-2 text-indigo-400" />
                      )}
                      <span className={`font-bold ${
                        index === 0 ? 'text-yellow-700' :
                        index === 1 ? 'text-gray-700' :
                        index === 2 ? 'text-amber-700' :
                        'text-indigo-700'
                      }`}>
                        {item.score.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Image
                src="/characters/default.jpg"
                alt="No rankings"
                width={100}
                height={100}
                className="mx-auto rounded-full mb-4 opacity-50"
              />
              <p className="text-gray-500 mb-2">아직 랭킹 데이터가 없습니다.</p>
              <p className="text-sm text-gray-400">게임을 플레이하고 첫 기록을 남겨보세요!</p>
            </div>
          )}
        </div>
        
        {/* 랭킹 설명 */}
        <div className="bg-white rounded-lg shadow-sm p-4 text-sm text-gray-600">
          <h3 className="font-medium text-indigo-700 mb-2">이탈리안 브레인롯 랭킹 시스템</h3>
          <p className="mb-2">
            랭킹은 게임에서 획득한 점수를 기준으로 정렬됩니다. 점수는 정답 정확도, 응답 시간, 
            연속 정답 횟수에 따라 계산됩니다.
          </p>
          <p>
            더 높은 점수를 획득하려면 정확하고 빠르게 답변하고, 연속으로 정답을 맞추세요!
          </p>
        </div>
      </div>
    </main>
  );
} 