'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useRouter } from 'next/navigation';

export default function Results() {
  const { quizResults, characters } = useGameStore();
  const [selectedResult, setSelectedResult] = useState<number | null>(null);
  const router = useRouter();

  const handleSubmitRanking = async () => {
    const name = prompt('이름을 입력하세요:');
    if (name) {
      try {
        const score = quizResults.filter(result => result.correct).length;
        await addDoc(collection(db, 'rankings'), {
          name,
          score,
          date: new Date().toISOString()
        });
        router.push('/ranking');
      } catch (error) {
        console.error('랭킹 저장 실패:', error);
      }
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold text-center mb-8">퀴즈 결과</h1>
      
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {quizResults.map((result, index) => {
            const character = characters.find(c => c.id === result.characterId);
            if (!character) return null;
            
            return (
              <div
                key={index}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  selectedResult === index
                    ? 'bg-blue-100 scale-105'
                    : result.correct
                    ? 'bg-green-100'
                    : 'bg-red-100'
                }`}
                onClick={() => setSelectedResult(selectedResult === index ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img
                      src={character.image}
                      alt={character.name}
                      className="w-16 h-16 object-cover rounded-lg mr-4"
                    />
                    <div>
                      <h3 className="text-xl font-semibold">{character.name}</h3>
                      <p className="text-gray-600">
                        {new Date(result.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-2xl">
                    {result.correct ? '✅' : '❌'}
                  </div>
                </div>
                
                {selectedResult === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <p className="text-gray-700">{character.description}</p>
                  </motion.div>
                )}
              </div>
            );
          })}
          
          <div className="text-center mt-8">
            <button
              onClick={handleSubmitRanking}
              className="bg-blue-500 text-white px-6 py-3 rounded-lg text-xl"
            >
              랭킹에 등록하기
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
} 