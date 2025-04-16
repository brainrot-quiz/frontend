'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { motion } from 'framer-motion';

interface Ranking {
  id: string;
  name: string;
  score: number;
  timestamp: Date;
}

export default function RankingsPage() {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const q = query(
          collection(db, 'rankings'),
          orderBy('score', 'desc'),
          limit(100)
        );
        
        const querySnapshot = await getDocs(q);
        const rankingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp.toDate()
        })) as Ranking[];
        
        setRankings(rankingsData);
      } catch (error) {
        console.error('랭킹 데이터 로드 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold text-center mb-8">랭킹 보드</h1>
      
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="grid grid-cols-4 gap-4 font-bold mb-4">
            <div>순위</div>
            <div>이름</div>
            <div>점수</div>
            <div>날짜</div>
          </div>
          
          {rankings.map((ranking, index) => (
            <motion.div
              key={ranking.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`grid grid-cols-4 gap-4 py-2 ${
                index % 2 === 0 ? 'bg-gray-50' : ''
              }`}
            >
              <div>{index + 1}</div>
              <div>{ranking.name}</div>
              <div>{ranking.score}</div>
              <div>{ranking.timestamp.toLocaleDateString()}</div>
            </motion.div>
          ))}
          
          {rankings.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              아직 랭킹 데이터가 없습니다.
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 