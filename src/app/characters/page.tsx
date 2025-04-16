'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon } from '@heroicons/react/24/solid';
import { characters as importedCharacters } from '@/data/characters';
import Image from 'next/image';

interface CharacterWithLikes {
  id: string;
  name: string;
  description: string;
  image: string;
  likes: number;
}

export default function Characters() {
  const [characters, setCharacters] = useState<CharacterWithLikes[]>([]);
  
  // 좋아요 데이터 로드
  useEffect(() => {
    try {
      // 로컬 스토리지에서 좋아요 데이터 불러오기
      const likesData = localStorage.getItem('character_likes') || '{}';
      const likes = JSON.parse(likesData);
      
      // 데이터 처리
      const processedCharacters = importedCharacters.map(char => ({
        id: char.id,
        name: char.name,
        description: char.description || '',
        image: `/characters/${char.image}`,
        likes: likes[char.id] || 0
      }));
      
      // 좋아요 순으로 정렬
      const sortedCharacters = processedCharacters.sort((a, b) => b.likes - a.likes);
      setCharacters(sortedCharacters);
    } catch (error) {
      console.error('캐릭터 데이터 처리 중 오류:', error);
      
      // 오류 발생 시 기본 데이터 사용
      const defaultCharacters = importedCharacters.map(char => ({
        id: char.id,
        name: char.name,
        description: char.description || '',
        image: `/characters/${char.image}`,
        likes: 0
      }));
      setCharacters(defaultCharacters);
    }
  }, []);
  
  // 좋아요 처리 함수
  const handleLike = (characterId: string) => {
    try {
      // 현재 좋아요 데이터 가져오기
      const likesData = localStorage.getItem('character_likes') || '{}';
      const likes = JSON.parse(likesData);
      
      // 해당 캐릭터 좋아요 증가
      likes[characterId] = (likes[characterId] || 0) + 1;
      
      // 로컬 스토리지에 저장
      localStorage.setItem('character_likes', JSON.stringify(likes));
      
      // 상태 업데이트
      setCharacters(prevCharacters => {
        const updatedCharacters = prevCharacters.map(char => 
          char.id === characterId 
            ? { ...char, likes: char.likes + 1 } 
            : char
        );
        return updatedCharacters.sort((a, b) => b.likes - a.likes);
      });
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gradient-to-b from-blue-50 to-indigo-100">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 text-indigo-800">캐릭터 도감</h1>
      <p className="text-center text-gray-600 mb-8">Italian Brainrot의 모든 캐릭터를 만나보세요!</p>
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {characters.map((character, index) => (
          <motion.div
            key={character.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0,
              transition: { delay: index * 0.05 }
            }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-md overflow-hidden"
          >
            <div className="h-48 overflow-hidden">
              <Image
                src={character.image}
                alt={character.name}
                width={400}
                height={400}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-5">
              <h2 className="text-xl font-bold mb-2 text-indigo-800">{character.name}</h2>
              <p className="text-gray-600 mb-4 line-clamp-3">{character.description}</p>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="text-indigo-600 font-medium">{character.likes}</span>
                  <span className="text-gray-500 ml-1">likes</span>
                </div>
                
                <button
                  onClick={() => handleLike(character.id)}
                  className="flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 px-4 py-2 rounded-lg transition-colors"
                >
                  <HeartIcon className="h-5 w-5 mr-1" />
                  <span>좋아요</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </main>
  );
} 