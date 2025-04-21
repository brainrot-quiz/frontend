'use client';

import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { motion } from 'framer-motion';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseInstance } from '@/firebase/config';
import Image from 'next/image';
import { Character as GameCharacter } from '@/data/characters';
import Link from 'next/link';

// 운세 페이지용 캐릭터 인터페이스 정의
interface FortuneCharacter {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
}

// 기본 캐릭터 정보 (캐릭터가 로드되지 않을 경우 사용)
const DEFAULT_CHARACTER: FortuneCharacter = {
  id: 'default',
  name: '미스테리 캐릭터',
  imageUrl: 'https://via.placeholder.com/150',
  description: '신비로운 캐릭터'
};

// 캐릭터 운세 등급 (각 캐릭터별 확률 가중치)
const CHARACTER_WEIGHTS = {
  'udin': 10,     // 높은 확률
  'mattia': 10,   // 높은 확률
  'marco': 8,     // 중간 확률
  'carlo': 8,     // 중간 확률
  'giovanni': 5,  // 낮은 확률
  // 다른 캐릭터들은 기본값 1로 설정됨
};

// 운세 메시지 유형 (MZ 친화적인 형식)
const FORTUNE_TYPES = [
  {
    type: '행운',
    emoji: '✨',
    messages: [
      '의 기운으로 오늘 당신의 행운지수는 최고조! #행운가득 #좋은일만',
      '처럼 빛나는 에너지가 당신을 감싸고 있어요. 오늘은 특별한 일이 생길지도? #운세맛집 #좋은하루',
      '가 당신에게 행운을 가져다줄 거예요. 복권 한 장 어때요? #행운의날 #기회'
    ]
  },
  {
    type: '사랑',
    emoji: '💕',
    messages: [
      '의 로맨틱한 기운이 당신을 감싸고 있어요. 오늘은 썸이 곧 연애로? #썸에서연애로 #고백각',
      '처럼 매력적인 당신, 오늘은 특별한 만남이 있을지도 몰라요. #운명적만남 #썸타는중',
      '의 따뜻한 마음이 당신의 연애운을 상승시켜줄 거예요. #연애운상승 #설렘가득'
    ]
  },
  {
    type: '성공',
    emoji: '🔥',
    messages: [
      '의 열정이 당신을 성공으로 이끌 거예요. 도전을 두려워하지 마세요! #도전해봐 #성공각',
      '처럼 목표를 향해 꾸준히 나아가세요. 결과는 분명 좋을 거예요. #목표달성 #꾸준함',
      '의 에너지로 당신의 일은 술술 풀릴 거예요. 오늘 작업 효율 최고! #효율킹 #일잘러'
    ]
  },
  {
    type: '건강',
    emoji: '💪',
    messages: [
      '의 활력이 당신에게 전해져요. 오늘은 운동하기 딱 좋은 날! #건강지킴이 #활력충전',
      '처럼 건강한 에너지가 당신을 채울 거예요. 새로운 습관을 시작해보는 건 어때요? #습관형성 #건강습관',
      '의 기운으로 피로가 싹 풀릴 거예요. 충분한 휴식도 잊지 마세요. #셀프케어 #힐링타임'
    ]
  },
  {
    type: '지혜',
    emoji: '🧠',
    messages: [
      '의 지혜가 당신에게 전해질 거예요. 어려운 문제도 술술 풀릴 듯! #문제해결 #똑똑이',
      '처럼 현명한 선택을 하게 될 거예요. 중요한 결정이 있다면 오늘 해보세요. #현명한선택 #결정의날',
      '의 통찰력으로 새로운 아이디어가 떠오를 거예요. 메모해두세요! #아이디어뱅크 #영감'
    ]
  }
];

// 이탈리안 브레인롯 캐릭터 목록 (확장)
const QUIZ_CHARACTERS: FortuneCharacter[] = [
  {
    id: 'udin',
    name: 'U Din Din Din Din Dun Ma Din Din Din Dun',
    imageUrl: '/characters/U Din Din Din Din Dun Ma Din Din Din Dun .webp',
    description: '반복되는 소리로 노래하는 캐릭터로 U Din Din Din Din Dun Ma Din Din Din Dun이라는 이름을 가지고 있습니다. 중독성 있는 멜로디를 가진 음악적 캐릭터입니다.'
  },
  {
    id: 'tralalero',
    name: 'Tralalero Tralala',
    imageUrl: '/characters/Tralalero Tralala .webp',
    description: '파도조종, 빠른 달리기 속도, 슈퍼 점프, 강한 저작력을 가진 상어 캐릭터. 나이키 운동화를 신고 있으며 포트나이트 레전드 플레이어입니다.'
  },
  {
    id: 'bombardiro',
    name: 'Bombardiro Crocodilo',
    imageUrl: '/characters/Bombardiro Crocodilo .webp',
    description: '폭격과 비행 능력을 가진 악어와 폭격기를 합성한 캐릭터. 높은 고도에서 정확한 폭격이 가능하며 뛰어난 비행 능력을 가지고 있습니다.'
  },
  {
    id: 'tripi',
    name: 'Trippi Troppi',
    imageUrl: '/characters/Trippi Troppi .webp',
    description: '빠른 헤엄, 파동, 해일, 고양이 음파, 물기 능력을 가진 캐릭터. 물속에서 자유자재로 움직이며 강력한 파동 공격이 가능합니다.'
  },
  {
    id: 'burbaloni',
    name: 'Burbaloni Lulilolli',
    imageUrl: '/characters/Burbaloni Lulilolli .webp',
    description: '수영을 잘하는 코코넛 안에 카피바라가 들어있는 캐릭터. 독특한 이중 구조로 보호받으며 친근한 성격을 가지고 있습니다.'
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino Assassino',
    imageUrl: '/characters/Cappuccino Assassino .webp',
    description: '커피 능력을 가진 캐릭터로, 에너지와 각성 효과를 부여할 수 있습니다. 거품 폭발 공격과 따뜻한 힐링 능력도 보유했습니다.'
  },
  {
    id: 'frigo',
    name: 'Frigo Camelo',
    imageUrl: '/characters/Frigo Camelo .webp',
    description: '냉장고 형태의 캐릭터로 냉기 능력을 사용할 수 있습니다. 음식을 신선하게 보관하는 능력과 강력한 냉동 빔을 발사할 수 있습니다.'
  },
  {
    id: 'boneca',
    name: 'Boneca Ambalabu',
    imageUrl: '/characters/Boneca Ambalabu .webp',
    description: '인형 모양의 캐릭터로 다양한 장난감 능력을 사용합니다. 장난감 변신 능력과 귀여운 외모로 적의 공격을 회피할 수 있습니다.'
  },
  {
    id: 'bobrito',
    name: 'Bobrito bandito',
    imageUrl: '/characters/Bobrito bandito .webp',
    description: '부리토 형태의 캐릭터로 맛있는 음식 능력을 가졌습니다. 다양한 재료로 적을 혼란시키고 영양 가득한 치유력을 발휘합니다.'
  },
  {
    id: 'vaca',
    name: 'La Vaca Saturno Saturnita',
    imageUrl: '/characters/La Vaca Saturno Saturnita .webp',
    description: '젖소 캐릭터로 우유 발사와 소 특유의 울음소리 공격을 사용합니다. 영양 높은 우유로 아군을 회복시킬 수 있습니다.'
  },
  {
    id: 'tung',
    name: 'Tung Tung Tung Tung Tung Tung Tung Tung Tung Sahur',
    imageUrl: '/characters/Tung Tung Tung Tung Tung Tung Tung Tung Tung Sahur .webp',
    description: '강력한 타격 능력을 가진 캐릭터로 주먹 공격과 지진파 생성이 가능합니다. 단단한 방어력과 파괴적인 공격력이 특징입니다.'
  },
  {
    id: 'lirilì',
    name: 'Lirilì Larilà',
    imageUrl: '/characters/Lirilì Larilà .webp',
    description: '음악적 능력을 가진 캐릭터로 노래로 적을 매혹시키거나 아군에게 힘을 줄 수 있습니다. 다양한 음악 장르를 활용한 공격이 특기입니다.'
  },
  {
    id: 'brr',
    name: 'Brr Brr Patapim',
    imageUrl: '/characters/Brr Brr Patapim .webp',
    description: '추위와 관련된 능력을 가진 캐릭터로 얼음 공격과 눈보라 생성이 가능합니다. 차가운 기운으로 적의 움직임을 둔화시킵니다.'
  },
  {
    id: 'bombombini',
    name: 'Bombombini Gusini',
    imageUrl: '/characters/Bombombini Gusini .webp',
    description: '폭발 능력을 가진 꿀벌 캐릭터로 꿀 폭탄과 날카로운 침 공격을 사용합니다. 빠른 비행 능력과 폭발적인 공격력이 특징입니다.'
  },
  {
    id: 'chimpanzini',
    name: 'Chimpanzini Bananini',
    imageUrl: '/characters/Chimpanzini Bananini .webp',
    description: '침팬지 캐릭터로 뛰어난 민첩성과 나무 타기 능력을 가졌습니다. 바나나 던지기와 영리한 지능으로 문제를 해결합니다.'
  },
  {
    id: 'glorbo',
    name: 'Glorbo Fruttodrillo',
    imageUrl: '/characters/Glorbo Fruttodrillo .webp',
    description: '깨물기 능력을 가진 수박에 악어의 머리와 다리가 달린 캐릭터. 주로 늪지대에 서식하며, 몸무게는 304kg입니다.'
  },
  {
    id: 'giraffa',
    name: 'Girafa Celestre',
    imageUrl: '/characters/Girafa Celestre .webp',
    description: '수박씨를 초속 50km로 뱉는 능력을 가진 수박, 기린, 우주인을 모티브로 한 캐릭터입니다.'
  },
  {
    id: 'tata',
    name: 'Ta Ta Ta Ta Ta Ta Ta Ta Ta Ta Ta Sahur',
    imageUrl: '/characters/Ta Ta Ta Ta Ta Ta Ta Ta Ta Ta Ta Sahur .webp',
    description: '증기 생성, 굉장한 발차기 능력을 가진 주전자와 다리, 팔, 얼굴을 합성한 캐릭터. 항상 울상이며 슬플 때 주전자 입구에서 증기가 나옵니다.'
  },
  {
    id: 'brii',
    name: 'Brii Brii Bicus Dicus Bombicus',
    imageUrl: '/characters/Brii Brii Bicus Dicus Bombicus .webp',
    description: '검술 능력을 가진 켄투리오 복장을 하고 목에 산딸기를 두른 조류 캐릭터. 체구는 작지만 자존심이 매우 큽니다.'
  },
  {
    id: 'talpa',
    name: 'Talpa Di Ferro',
    imageUrl: '/characters/Talpa Di Ferro .webp',
    description: '주변 탐색, 스캔, 드릴 능력을 가진 몸 여러 부위가 기계화된 쥐 캐릭터. 눈과 이마에 스캔용 마이크로칩이 있고, 코에는 어떤 단단한 물체도 뚫을 수 있는 드릴이 있습니다.'
  },
  {
    id: 'ballerina',
    name: 'Ballerina Cappuccina',
    imageUrl: '/characters/Ballerina Cappuccina .webp',
    description: '발레 능력을 가진 머리는 카푸치노이며, 분홍색 치마를 입은 발레리나 캐릭터. Cappuccino Assassino의 아내로, 음악을 사랑합니다.'
  },
  {
    id: 'blueberrinni',
    name: 'Blueberrinni Octopussini',
    imageUrl: '/characters/Blueberrinni Octopussini .webp',
    description: '발판공격, 빠른 수영 능력을 가진 상반신이 블루베리인 문어 캐릭터. 블루베리만큼 작아서 공격을 피하기 쉽고, 해양의 신비로움을 상징합니다. 깊은 바다에서 나타나 마술 같은 푸른 잉크를 뿌립니다.'
  },
  {
    id: 'bombardiere',
    name: 'Bombardiere Lucertola',
    imageUrl: '/characters/Bombardiere Lucertola .webp',
    description: '폭격, 비행, 위장 능력을 가진 폭격기와 도마뱀을 합성한 캐릭터. Bombardiro Crocodillo를 업그레이드하는 과정에서 개발되었으며, 강한 파괴력과 빠른 움직임이 특징입니다.'
  },
  {
    id: 'chef',
    name: 'Chef Crabracadabra',
    imageUrl: '/characters/Chef Crabracadabra .webp',
    description: '마법의 요리를 만드는 게 셰프입니다. 저주의 요리 능력을 가진 게의 머리와 집게가 달린 요리사 캐릭터. 원래는 어부였으나 바다 마녀와의 계약 후 게가 되었습니다. 그의 집게발로 만든 요리는 맛뿐만 아니라 마법적인 효과도 가지고 있습니다.'
  },
  {
    id: 'frulli',
    name: 'Fruli Frula',
    imageUrl: '/characters/Fruli Frula .webp',
    description: '쪼기, 커피 마시기 능력을 가진 동그란 고글을 쓴 조류 캐릭터입니다. 곡식을 쪼아 먹는 것을 좋아하며, 항상 즐겁고 활기찬 에너지로 가득 차 있습니다. 다양한 색의 과일 조각들이 연상되는 독특한 외형을 가지고 있습니다.'
  },
  {
    id: 'garamaraman',
    name: 'Garamaraman dan Madudungdung tak tuntung perkuntung',
    imageUrl: '/characters/Garamaraman dan Madudungdung tak tuntung perkuntung .webp',
    description: '소금 통과 꿀단지에 사람의 얼굴과 발을 합성한 캐릭터. 소금 통의 이름은 가라마라만, 꿀 통의 이름은 만두둥둥입니다. 인도네시아 민속 이야기에서 영감을 받은 이 캐릭터는 복잡한 이름만큼 예측할 수 없는 행동으로 유명합니다.'
  },
  {
    id: 'cacto',
    name: 'Il Cacto Hipopotamo',
    imageUrl: '/characters/Il Cacto Hipopotamo .webp',
    description: '밟기 능력을 가진 선인장 몸통에 하마의 머리를 하고 샌들을 신고 있는 캐릭터입니다. 사막에서 생존력이 뛰어나며, 두꺼운 피부로 어떤 환경에서도 살아남을 수 있는 강인한 생명력을 가지고 있습니다.'
  },
  {
    id: 'pothotspot',
    name: 'Pot hotspot',
    imageUrl: '/characters/Pot hotspot .webp',
    description: '핫스팟 요청, 무한으로 과자 사먹기 능력을 가진 해골과 핸드폰, 와이파이를 합성한 캐릭터. "Hotspot bro"라는 말을 자주 합니다.'
  },
  {
    id: 'svinino',
    name: 'Svinino Bombondino',
    imageUrl: '/characters/Svinino Bombondino .webp',
    description: '자폭 능력을 가진 돼지와 폭탄을 합성한 캐릭터입니다. 폭발하면 주변에 사탕이 흩날립니다.'
  },
  {
    id: 'trippatroppa',
    name: 'Trippa Troppa Tralala Lirilì Rilà Tung Tung Sahur Boneca Tung Tung Tralalelo Trippi Troppa Crocodina',
    imageUrl: '/characters/Trippa Troppa Tralala Lirilì Rilà Tung Tung Sahur Boneca Tung Tung Tralalelo Trippi Troppa Crocodina .webp',
    description: '가장 유명한 캐릭터 6인방인 트리피 트로피, 트랄랄레로 트랄랄라, 리릴리 라릴라, 퉁 퉁 퉁 사후르, 보네카 암발라부, 봄바르디로 크로코딜로가 합쳐진 캐릭터로 Italian Brainrot의 최강자입니다.'
  },
  {
    id: 'troppatrippa',
    name: 'Troppa Trippa',
    imageUrl: '/characters/Troppa Trippa.webp',
    description: '뒤집힌 트로파 트리파 캐릭터로 세상을 거꾸로 보는 독특한 시각을 가지고 있습니다. 독특한 공간 인식 능력이 있습니다.'
  },
  {
    id: 'trulimero',
    name: 'Trulimero Trulicina',
    imageUrl: '/characters/Trulimero Trulicina .webp',
    description: '수영을 잘하는 물고기의 몸통에 고양이의 머리, 사람의 다리 4개가 붙어있는 캐릭터입니다. 다양한 환경에 적응이 가능합니다.'
  },
  {
    id: 'blueberrinni',
    name: 'Blueberrinni Octopussini',
    imageUrl: '/characters/Blueberrinni Octopussini .webp',
    description: '푸른 블루베리처럼 생긴 문어 캐릭터로, 해양의 신비로움을 상징합니다. 블루베리니는 깊은 바다에서 나타나 마술 같은 푸른 잉크를 뿌립니다.'
  },
  {
    id: 'bombardiere',
    name: 'Bombardiere Lucertola',
    imageUrl: '/characters/Bombardiere Lucertola .webp',
    description: '폭격 전문 도마뱀 캐릭터로, 전쟁의 혼란 속에서도 용기를 잃지 않는 모습을 보여줍니다. 강한 파괴력과 빠른 움직임이 특징입니다.'
  },
  {
    id: 'chef',
    name: 'Chef Crabracadabra',
    imageUrl: '/characters/Chef Crabracadabra .webp',
    description: '마법의 요리를 만드는 게 셰프입니다. 그의 집게발로 만든 요리는 맛뿐만 아니라 마법적인 효과도 가지고 있습니다. 심해의 비밀 재료로 최고의 요리를 선보입니다.'
  },
  {
    id: 'frulli',
    name: 'Fruli Frula',
    imageUrl: '/characters/Fruli Frula .webp',
    description: '과일 혼합 음료를 연상시키는 이 캐릭터는 항상 즐겁고 활기찬 에너지로 가득 차 있습니다. 다양한 색의 과일 조각들이 모여 만들어진 독특한 외형을 가지고 있습니다.'
  },
  {
    id: 'garamaraman',
    name: 'Garamaraman dan Madudungdung tak tuntung perkuntung',
    imageUrl: '/characters/Garamaraman dan Madudungdung tak tuntung perkuntung .webp',
    description: '긴 이름을 가진 신비로운 캐릭터로, 인도네시아 민속 이야기에서 영감을 받았습니다. 복잡한 이름만큼 복잡한 성격을 가지고 있으며, 예측할 수 없는 행동으로 유명합니다.'
  },
  {
    id: 'cacto',
    name: 'Il Cacto Hipopotamo',
    imageUrl: '/characters/Il Cacto Hipopotamo .webp',
    description: '선인장과 하마가 결합된 독특한 캐릭터로, 사막과 강을 오가며 살아갑니다. 두꺼운 피부로 어떤 환경에서도 살아남을 수 있는 강인한 생명력을 가지고 있습니다.'
  },
  {
    id: 'pothotspot',
    name: 'Pot hotspot',
    imageUrl: '/characters/Pot hotspot .webp',
    description: '끓어오르는 냄비 같은 모습의 이 캐릭터는 항상 뜨거운 아이디어로 가득 차 있습니다. 주변 사람들에게 영감과 에너지를 전달하는 능력이 있습니다.'
  },
  {
    id: 'svinino',
    name: 'Svinino Bombondino',
    imageUrl: '/characters/Svinino Bombondino .webp',
    description: '사탕처럼 달콤한 성격의 돼지 캐릭터로, 누구에게나 친절하고 상냥합니다. 그의 주변에는 항상 달콤한 향기가 감돌며, 우울한 마음도 달래줍니다.'
  },
  {
    id: 'trippatroppa',
    name: 'Trippa Troppa Tralala Lirilì Rilà Tung Tung Sahur Boneca Tung Tung Tralalelo Trippi Troppa Crocodina',
    imageUrl: '/characters/Trippa Troppa Tralala Lirilì Rilà Tung Tung Sahur Boneca Tung Tung Tralalelo Trippi Troppa Crocodina .webp',
    description: '가장 긴 이름을 가진 전설적인 캐릭터로, 모든 인기 캐릭터의 특성을 조합한 궁극의 존재입니다. 그의 이름을 완벽하게 외울 수 있는 사람은 거의 없을 정도로 복잡합니다.'
  },
  {
    id: 'trulimero',
    name: 'Trulimero Trulicina',
    imageUrl: '/characters/Trulimero Trulicina .webp',
    description: '동화 속에서 튀어나온 듯한 몽환적인 분위기의 캐릭터로, 노래하는 것을 좋아하며 마법의 멜로디로 사람들의 마음을 사로잡습니다.'
  },
  {
    id: 'troppatrippa',
    name: 'Troppa Trippa',
    imageUrl: '/characters/Troppa Trippa.webp',
    description: '식탐이 많은 이 캐릭터는 항상 배가 고픈 상태입니다. 어떤 음식이든 맛있게 먹어치우는 능력이 있으며, 먹을수록 더 행복해지는 특징이 있습니다.'
  }
];

// 캐릭터 랭크 정보 추가
const CHARACTER_RANKS = {
  // GOATED 랭크
  'tralalero': 'GOATED',
  'bombardiro': 'GOATED',
  'lirilì': 'GOATED',
  'tung': 'GOATED',
  'trippatroppa': 'GOATED',
  
  // GREAT 랭크
  'brr': 'GREAT',
  'bombombini': 'GREAT',  // 'bombini'에서 'bombombini'로 수정
  'chimpanzini': 'GREAT',
  'ballerina': 'GREAT',
  'talpa': 'GREAT',
  'bombardiere': 'GREAT',
  'chef': 'GREAT',
  'blueberrinni': 'GREAT',
  
  // GOOD 랭크
  'vaca': 'GOOD',
  'tripi': 'GOOD',
  'boneca': 'GOOD',
  'cappuccino': 'GOOD',
  'frigo': 'GOOD',
  'giraffa': 'GOOD',
  'tata': 'GOOD',
  'svinino': 'GOOD',
  'troppatrippa': 'GOOD',
  'trulimero': 'GOOD',
  
  // MID 랭크
  'burbaloni': 'MID',
  'glorbo': 'MID',
  'bobrito': 'MID',
  'cacto': 'MID',
  'frulli': 'MID',
  'brii': 'MID',
  'pothotspot': 'MID',
  'garamaraman': 'MID',
  
  // MEH 랭크
  'crocodildo': 'MEH',
  'bananitta': 'MEH',
  'udin': 'MEH',
  'fake tripi': 'MEH',
  'tigrulini': 'MEH',
  'tralalero talalma': 'MEH',
  'trenostruzzo': 'MEH',
  
  // BAD 랭크
  'bambini': 'BAD',
  'crocodilo': 'BAD',
  'sacro': 'BAD',
  'tigrulli': 'BAD',
  'trick track': 'BAD',
  'barabum': 'BAD',
  'cocossini': 'BAD',
  'tricki': 'BAD',
  'pippi poppa': 'BAD',
  
  // TERRIBLE 랭크
  'gattino': 'TERRIBLE',
  'ecco cavallo': 'TERRIBLE',
  'gatto': 'TERRIBLE',
  'perochello': 'TERRIBLE',
  'graipusci': 'TERRIBLE',
  'gatto vegano': 'TERRIBLE',
  'fake trick': 'TERRIBLE',
  'granade': 'TERRIBLE',
  'kepukai': 'TERRIBLE',
  'uvanito': 'TERRIBLE'
};

// 캐릭터 랭크별 메시지 템플릿 추가
const CHARACTER_TEMPLATES = {
  GOATED: [
    '{name}의 {ability} 능력을 타고난 당신! 오늘은 모든 것이 당신 뜻대로 될 거예요! #절대GOD #찐GOAT',
    '{name}처럼 {ability} 능력이 극대화되는 날이에요! 무적의 하루를 보낼 준비 되셨나요? #무적 #갓생',
    '와우! {name}의 {ability} 에너지가 당신을 압도하고 있어요. 이런 날은 복권을 사도 좋을 것 같네요! #당첨확정 #행운폭발',
    '{name}의 {ability} 파워로 오늘 당신은 그 누구도 당신을 막을 수 없어요! #최강자 #정점찍기',
    '{name}의 {ability} 능력이 폭주하는 하루! 당신의 매력이 폭발할 거예요! #매력폭발 #인기폭주',
    '{name}처럼 당신도 오늘 {ability} 능력치가 만렙! 무엇이든 이뤄낼 수 있어요! #만렙달성 #성취의날'
  ],
  GREAT: [
    '{name}의 {ability} 기운이 당신에게 흘러들어오고 있어요. 오늘은 특별한 하루가 될 거예요! #대박 #행운의날',
    '{name}처럼 {ability} 실력을 발휘할 수 있는 날이에요. 도전을 두려워하지 마세요! #도전 #성공',
    '{name}의 {ability} 능력이 당신의 오늘을 빛나게 할 거예요. 큰 성과를 기대해도 좋아요! #성취 #빛나는순간',
    '{name}이(가) 당신의 {ability} 재능을 응원하고 있어요. 오늘은 평소보다 더 뛰어난 성과를 낼 수 있을 거예요! #재능폭발 #인정받는날',
    '{name}처럼 {ability} 능력을 십분 발휘하면 연인에게 더 매력적으로 보일 거예요! #매력상승 #러브온',
    '{name}의 {ability} 에너지로 오늘 모든 일이 순조롭게 풀릴 거예요! #일이술술 #좋은흐름'
  ],
  GOOD: [
    '{name}처럼 {ability} 능력을 발휘하면 오늘 하루가 더 즐거워질 거예요! #좋은하루 #긍정에너지',
    '{name}의 {ability} 기운이 당신과 함께해요. 오늘은 평소보다 운이 좋은 날이에요! #행운 #긍정',
    '{name}이(가) 당신에게 {ability} 힘을 나눠주고 있어요. 오늘의 작은 도전들을 즐겨보세요! #도전 #즐거움',
    '{name}의 {ability} 에너지로 오늘 하루가 산뜻하게 시작될 거예요! #상쾌한아침 #에너지충전',
    '{name}의 {ability} 능력을 본받아 오늘은 어떤 문제든 현명하게 해결할 수 있을 거예요! #문제해결 #현명함',
    '{name}처럼 당신도 오늘 {ability} 능력이 빛을 발할 거예요! #능력발휘 #빛나는나'
  ],
  MID: [
    '{name}의 {ability} 기운이 약하게 느껴지지만, 그래도 평범한 하루가 될 거예요. #평범 #일상',
    '{name}처럼 {ability} 중간은 하는 날이네요. 너무 큰 기대는 금물! #중간 #보통',
    '{name}의 {ability} 기운이 오늘은 그저 그렇네요. 내일을 기대해봐요! #평범 #내일은더좋을거야',
    '{name}이(가) 당신에게 보내는 {ability} 신호가 미약해요. 오늘은 무난한 하루가 될 것 같아요. #무난 #평온한하루',
    '{name}의 {ability} 능력만큼 오늘은 그저 무난한 하루가 될 것 같아요. 평소처럼 지내도 괜찮아요. #일상 #평범',
    '{name}처럼 {ability} 능력이 보통인 하루! 너무 기대하지 말고 편안하게 보내세요. #편안 #여유'
  ],
  MEH: [
    '{name}의 {ability} 기운이 조금 약해요. 오늘은 조심스럽게 행동하는 게 좋겠어요. #주의 #조심',
    '{name}처럼 {ability} 능력이 약화된 것 같아요. 무리한 도전은 내일로 미루는 게 어떨까요? #미루기 #무리하지말기',
    '{name}이(가) 당신의 {ability}에 약간의 경고를 보내고 있어요. 중요한 결정은 다시 한번 생각해보세요. #재고 #신중함',
    '{name}의 {ability} 에너지가 오늘은 별로네요. 평소보다 조금 더 노력해야 할 것 같아요. #노력 #인내',
    '{name}처럼 당신의 {ability} 능력도 오늘은 좀 부족해 보여요. 가능하면 중요한 일은 피하세요. #주의 #피하기',
    '{name}의 {ability} 기운이 안 좋은 날이네요. 오늘은 소소한 일에 집중하는 게 좋을 것 같아요. #소소함 #작은일'
  ],
  BAD: [
    '{name}의 {ability} 기운이 매우 약해요. 오늘은 중요한 일은 피하는 게 좋겠어요. #주의 #회피',
    '{name}처럼 오늘 당신의 {ability} 능력은 최저치... 무리하지 말고 휴식을 취하세요. #휴식 #재충전',
    '{name}이(가) 당신의 {ability}에 빨간불을 켰어요. 오늘은 위험한 결정을 피하세요! #위험 #조심',
    '{name}의 {ability} 기운이 거의 바닥이에요. 오늘은 침대에서 나오지 않는 게 최선일지도? #침대지키기 #안전제일',
    '{name}의 {ability} 상태가 안 좋네요. 오늘은 집에서 넷플릭스 보면서 쉬는 날로 정하세요. #넷플데이 #힐링',
    '{name}처럼 당신도 오늘은 {ability} 에너지가 바닥나 있어요. 무리하지 말고 내일을 위해 충전하세요. #충전 #내일을위해'
  ],
  TERRIBLE: [
    '{name}의 {ability} 기운이 최악이에요! 오늘은 가능하면 집에 머무르는 게 좋겠어요. #집콕 #안전',
    '{name}처럼 당신의 {ability} 능력이 완전히 바닥났어요. 오늘은 모든 중요한 일을 취소하세요! #포기 #내일을위해',
    '{name}이(가) 당신의 {ability}에 심각한 경고를 보내고 있어요. 오늘은 아무것도 하지 않는 게 최선이에요. #경고 #절대안전',
    '{name}의 {ability} 에너지가 완전히 소진됐어요. 오늘은 침대에서 나오지 마세요! #침대지키기 #재앙회피',
    '{name}의 {ability} 상태만큼 당신의 운세도 최악이에요. 오늘은 아예 아무것도 시도하지 마세요. #절대안전 #포기',
    '{name}처럼 {ability} 능력이 완전히 꺼진 날! 외출은 절대 금물, 재충전에 집중하세요. #완전충전 #비상상황'
  ]
};

// 캐릭터 설명에서 능력 추출 함수
const extractCharacterAbility = (description: string): string => {
  // 기본 능력 목록
  const defaultAbilities = [
    '초능력', '마법', '특별한', '귀여운', '놀라운', '독특한', '신비한', '강력한', '재미있는', '행운의'
  ];
  
  // 설명에서 핵심 능력 추출 시도
  if (!description) return defaultAbilities[Math.floor(Math.random() * defaultAbilities.length)];
  
  // 특정 키워드 찾기
  const abilityKeywords = [
    '할 수 있', '능력', '파워', '특기', '잘하', '뛰어나', '전문가', '달인', '마스터', '재능',
    '조종', '달리기', '점프', '저작력', '폭격', '비행', '헤엄', '파동', '해일', '음파', '물기', '수영'
  ];
  
  for (const keyword of abilityKeywords) {
    if (description.includes(keyword)) {
      // 키워드 주변 20자 추출
      const index = description.indexOf(keyword);
      const start = Math.max(0, index - 10);
      const end = Math.min(description.length, index + 20);
      const context = description.substring(start, end);
      
      // 가장 가까운 문장 끝 찾기
      const endOfSentence = context.indexOf('.');
      if (endOfSentence !== -1) {
        return context.substring(0, endOfSentence);
      }
      return context;
    }
  }
  
  // 키워드가 없으면 설명의 첫 부분 사용
  if (description.length > 20) {
    return description.substring(0, 20) + '...';
  }
  
  return description || defaultAbilities[Math.floor(Math.random() * defaultAbilities.length)];
};

// 캐릭터 테마 추출 함수
const getCharacterTheme = (character: FortuneCharacter): string => {
  const description = character.description.toLowerCase();
  
  // 동물 테마
  const animalKeywords = ['고양이', '개', '동물', '사자', '호랑이', '곰', '토끼', '쥐', '강아지', '냥이', '멍멍이', '새', '조류', '어류', '물고기'];
  // 음식 테마
  const foodKeywords = ['음식', '빵', '케이크', '쿠키', '사탕', '초콜릿', '과자', '과일', '채소', '고기', '치즈', '피자', '햄버거', '아이스크림'];
  // 식물 테마
  const plantKeywords = ['식물', '꽃', '나무', '풀', '잎', '숲', '정원', '씨앗', '열매', '뿌리', '줄기', '새싹'];
  // 기계 테마
  const machineKeywords = ['기계', '로봇', '컴퓨터', '전자', '디지털', '엔진', '모터', '기어', '칩', '프로세서', '회로', '배터리'];
  // 신체 관련 테마
  const bodyKeywords = ['머리', '손', '발', '눈', '코', '입', '귀', '팔', '다리', '몸', '얼굴', '피부', '근육', '뼈', '심장'];
  
  if (animalKeywords.some(keyword => description.includes(keyword))) return '동물';
  if (foodKeywords.some(keyword => description.includes(keyword))) return '음식';
  if (plantKeywords.some(keyword => description.includes(keyword))) return '식물';
  if (machineKeywords.some(keyword => description.includes(keyword))) return '기계';
  if (bodyKeywords.some(keyword => description.includes(keyword))) return '신체';
  
  // 기본 테마
  return '일반';
};

// 랭크 기반 메시지 가져오기 함수 개선
const getRankMessage = (character: FortuneCharacter): string => {
  const rank = getCharacterRank(character.id);
  const templates = CHARACTER_TEMPLATES[rank as keyof typeof CHARACTER_TEMPLATES] || CHARACTER_TEMPLATES['MID'];
  const randomIndex = Math.floor(Math.random() * templates.length);
  
  // 캐릭터 능력 추출
  const ability = extractCharacterAbility(character.description);
  const theme = getCharacterTheme(character);
  
  // 메시지 생성 및 변수 치환
  let message = templates[randomIndex]
    .replace('{name}', character.name)
    .replace('{ability}', ability);
  
  // 특수 케이스 - 특정 캐릭터 맞춤형 메시지
  if (character.id === 'udin') {
    // U Din Din Din Din Dun에 대한 특별 메시지
    const udinMessages = [
      `${character.name}의 중독성 있는 멜로디처럼 오늘 하루가 당신의 머릿속에서 맴돌 거예요! #브레인롯 #중독성멜로디`,
      `"U Din Din Din Din Dun"처럼 반복되는 행운이 당신을 찾아올 거예요! #연속행운 #딘딘딘`,
      `${character.name}처럼 오늘 하루종일 당신의 이름을 연호하는 팬들이 생길지도? #인기폭발 #딘딘딘딘`,
      `${character.name}의 반복되는 리듬처럼 오늘은 같은 일이 반복되는 하루가 될 수 있어요! #데자뷰 #반복의미학`,
      `${character.name}처럼 귀에 꽂히는, 당신만의 특별한 매력이 빛날 거예요! #매력발산 #중독성`,
      `${character.name}의 노래처럼 당신의 말 한마디가 주변 사람들에게 깊은 인상을 남길 거예요! #영향력 #기억에남는`
    ];
    message = udinMessages[Math.floor(Math.random() * udinMessages.length)];
  } else if (character.id === 'tralalero') {
    // Tralalero에 대한 특별 메시지
    const tralaleroMessages = [
      `${character.name}의 파도조종 능력처럼 오늘 당신은 어떤 어려움의 파도도 자유자재로 다룰 수 있어요! #파도마스터 #찐갓생`,
      `나이키 운동화를 신은 ${character.name}처럼 오늘 당신은 모든 일에 Just Do It! 할 수 있어요! #나이키정신 #슈퍼점프`,
      `${character.name}처럼 포트나이트 레전드 플레이어급의 하루를 보내실 거예요! #빅토리로얄 #레전드승리`,
      `${character.name}의 빠른 달리기 속도처럼 오늘 당신의 업무 처리 속도는 어마어마할 거예요! #업무광속 #초스피드`,
      `${character.name}의 슈퍼 점프력처럼 당신의 성과도 수직 상승할 거예요! #성과점프 #수직상승`,
      `${character.name}처럼 어떤 파도도 넘을 수 있는 강한 저력을 발휘하게 될 거예요! #저력폭발 #위기극복`
    ];
    message = tralaleroMessages[Math.floor(Math.random() * tralaleroMessages.length)];
  } else if (character.id === 'bombardiro') {
    // Bombardiro에 대한 특별 메시지
    const bombardiroMessages = [
      `${character.name}처럼 오늘 당신은 목표물을 정확히 폭격할 수 있는 집중력을 가질 거예요! #목표달성 #정확폭격`,
      `${character.name}의 비행 능력처럼 오늘 당신은 어떤 장애물도 가뿐히 넘어설 수 있어요! #장애물극복 #높이날아`,
      `${character.name}의 강력한 폭격처럼 오늘 당신의 성과는 폭발적일 거예요! #폭발적성과 #임팩트만점`,
      `${character.name}처럼 오늘 당신은 어떤 고난도 목표도 명중시킬 수 있는 정확성을 가질 거예요! #슈퍼정확 #타겟달성`,
      `${character.name}의 강력한 폭발력처럼 당신의 매력이 주변 사람들에게 폭발적인 영향을 미칠 거예요! #매력폭발 #인기폭탄`,
      `${character.name}의 비행 능력처럼 당신은 오늘 모든 일에서 한 차원 높은 시각을 가질 수 있어요! #고차원시각 #넓은안목`
    ];
    message = bombardiroMessages[Math.floor(Math.random() * bombardiroMessages.length)];
  } else if (character.id === 'tripi') {
    // Tripi Tropi에 대한 특별 메시지
    const tripiMessages = [
      `${character.name}의 빠른 헤엄 실력처럼 오늘 당신은 어떤 상황에서도 신속하게 대처할 수 있어요! #신속대처 #유연함`,
      `${character.name}의 파동 능력처럼 당신의 긍정적인 에너지가 주변에 퍼져나갈 거예요! #긍정파동 #에너지전파`,
      `${character.name}의 고양이 음파처럼 당신의 말 한마디가 주변 사람들의 마음을 움직일 수 있어요! #설득력 #영향력`,
      `${character.name}의 해일 능력처럼 오늘 당신의 행운은 물밀듯이 밀려올 거예요! #행운폭포 #대박날`,
      `${character.name}처럼 당신도 오늘은 어떤 환경에서도 잘 적응하고 성공할 수 있어요! #환경적응 #생존의달인`
    ];
    message = tripiMessages[Math.floor(Math.random() * tripiMessages.length)];
  } else if (character.id === 'burbaloni') {
    // Burbaloni Luliloli에 대한 특별 메시지
    const burbaloniMessages = [
      `${character.name}처럼 당신도 오늘은 보호막 안에서 안전하고 평화로운 하루를 보낼 거예요! #안전지대 #평화로움`,
      `코코넛 속 카피바라 ${character.name}처럼 당신도 독특한 개성으로 주목받을 거예요! #개성만점 #주목받는`,
      `${character.name}의 수영 실력처럼 당신도 오늘 어떤 문제도 수월하게 헤쳐나갈 수 있어요! #문제해결 #수월함`,
      `${character.name}처럼 당신도 오늘은 특별한 보호를 받으며 행운이 함께할 거예요! #특별보호 #행운동행`,
      `${character.name}의 이중 정체성처럼 오늘 당신은 여러 역할을 완벽하게 수행할 수 있어요! #다재다능 #멀티플레이어`
    ];
    message = burbaloniMessages[Math.floor(Math.random() * burbaloniMessages.length)];
  }
  
  // 캐릭터 테마에 따른 추가 메시지
  let themeBonus = "";
  if (theme === '동물') {
    const animalBonuses = [
      `\n\n🐾 오늘은 ${character.name}의 동물적 감각을 믿어보세요!`,
      `\n\n🐾 ${character.name}처럼 야생의 직감으로 행운을 찾아보세요!`,
      `\n\n🐾 오늘 당신의 동물적 감각이 극대화되어 있어요!`,
      `\n\n🐾 ${character.name}의 본능을 닮아 위기를 기회로 바꿀 수 있는 날이에요!`,
      `\n\n🐾 ${character.name}처럼 자유롭고 야생적인 에너지로 하루를 보내보세요!`
    ];
    themeBonus = animalBonuses[Math.floor(Math.random() * animalBonuses.length)];
  } else if (theme === '음식') {
    const foodBonuses = [
      `\n\n🍽️ 오늘은 ${character.name}처럼 당신의 맛있는 성공을 맛보게 될 거예요!`,
      `\n\n🍽️ ${character.name}의 달콤한 에너지가 당신의 하루를 풍미있게 만들 거예요!`,
      `\n\n🍽️ 오늘 하루는 ${character.name}처럼 모두의 입맛을 사로잡는 날이 될 거예요!`,
      `\n\n🍽️ ${character.name}처럼 당신도 오늘은 모두가 원하는 특별한 맛을 선사할 거예요!`,
      `\n\n🍽️ 오늘은 ${character.name}의 달콤함처럼 행복한 순간들이 가득할 거예요!`
    ];
    themeBonus = foodBonuses[Math.floor(Math.random() * foodBonuses.length)];
  } else if (theme === '식물') {
    const plantBonuses = [
      `\n\n🌱 ${character.name}처럼 어떤 환경에서도 적응하고 성장할 수 있는 하루예요!`,
      `\n\n🌱 오늘은 ${character.name}의 단단함을 본받아 어떤 역경도 이겨내세요!`,
      `\n\n🌱 ${character.name}의 생명력으로 지친 일상에 활력을 불어넣어보세요!`,
      `\n\n🌱 ${character.name}처럼 당신의 뿌리를 더 깊이 내리고 더 높이 성장할 수 있는 날이에요!`,
      `\n\n🌱 오늘은 ${character.name}의 강인함을 본받아 어떤 어려움도 견뎌낼 수 있어요!`
    ];
    themeBonus = plantBonuses[Math.floor(Math.random() * plantBonuses.length)];
  } else if (theme === '기계') {
    const machineBonuses = [
      `\n\n⚙️ ${character.name}처럼 오늘 당신의 효율성은 최고조에 달할 거예요!`,
      `\n\n⚙️ 오늘은 ${character.name}의 정밀함으로 모든 일을 완벽하게 해낼 수 있어요!`,
      `\n\n⚙️ ${character.name}처럼 멈추지 않는 에너지로 목표를 향해 나아가세요!`,
      `\n\n⚙️ ${character.name}의 정확한 기계적 움직임처럼 오늘 당신의 모든 계획은 완벽하게 진행될 거예요!`,
      `\n\n⚙️ 오늘은 ${character.name}처럼 어떤 복잡한 문제도 논리적으로 해결할 수 있어요!`
    ];
    themeBonus = machineBonuses[Math.floor(Math.random() * machineBonuses.length)];
  } else if (theme === '신체') {
    const bodyBonuses = [
      `\n\n💪 ${character.name}처럼 오늘 당신의 신체 컨디션은 최상일 거예요!`,
      `\n\n💪 오늘은 ${character.name}의 강인함을 닮아 어떤 체력적 도전도 가뿐히 해낼 수 있어요!`,
      `\n\n💪 ${character.name}의 에너지가 당신의 건강을 챙겨줄 거예요!`,
      `\n\n💪 오늘 하루 ${character.name}처럼 활력 넘치는 컨디션으로 보낼 수 있을 거예요!`
    ];
    themeBonus = bodyBonuses[Math.floor(Math.random() * bodyBonuses.length)];
  }
  
  return message + themeBonus;
};

// GameCharacter를 FortuneCharacter로 변환하는 함수
const convertToFortuneCharacter = (character: GameCharacter): FortuneCharacter => {
  return {
    id: character.id,
    name: character.name,
    imageUrl: character.image ? `/characters/${character.image}` : 'https://via.placeholder.com/150',
    description: character.description || '설명이 없는 캐릭터'
  };
};

// 캐릭터 랭크 가져오기 함수
const getCharacterRank = (characterId: string): string => {
  return CHARACTER_RANKS[characterId as keyof typeof CHARACTER_RANKS] || 'MID';
};

// 가중치 기반 랜덤 캐릭터 선택
const selectRandomCharacter = (charactersArray: GameCharacter[]): FortuneCharacter => {
  // 우선 게임 캐릭터 배열을 FortuneCharacter 형식으로 변환
  const convertedCharacters = charactersArray.map(convertToFortuneCharacter);
  
  // 퀴즈 캐릭터를 우선적으로 사용
  const characterPool = QUIZ_CHARACTERS.length > 0 ? QUIZ_CHARACTERS : convertedCharacters;
  
  if (!characterPool || characterPool.length === 0) {
    return DEFAULT_CHARACTER;
  }
  
  // 각 캐릭터에 가중치 부여
  const charactersWithWeights = characterPool.map(char => ({
    ...char,
    weight: char.id && typeof char.id === 'string' && CHARACTER_WEIGHTS[char.id as keyof typeof CHARACTER_WEIGHTS] 
      ? CHARACTER_WEIGHTS[char.id as keyof typeof CHARACTER_WEIGHTS] 
      : 1 // 정의된 가중치가 없으면 기본값 1
  }));
  
  // 총 가중치 계산
  const totalWeight = charactersWithWeights.reduce((sum, char) => sum + char.weight, 0);
  
  // 랜덤 값 생성 (0 ~ 총 가중치)
  let random = Math.random() * totalWeight;
  
  // 가중치 기반으로 캐릭터 선택
  for (const char of charactersWithWeights) {
    random -= char.weight;
    if (random <= 0) {
      return char;
    }
  }
  
  // 만약 선택이 되지 않았다면 (에러 방지) 첫 번째 캐릭터 반환
  return charactersWithWeights[0];
};

// 남은 뽑기 확인 함수
const checkRemainingPulls = async (userId: string): Promise<number> => {
  try {
    const { db } = await getFirebaseInstance();
    const userDoc = await getDoc(doc(db, 'fortuneUsers', userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const lastPullDate = userData.lastPullDate?.toDate();
      if (lastPullDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const pullDate = new Date(lastPullDate);
        pullDate.setHours(0, 0, 0, 0);
        
        // 오늘 이미 뽑기를 했는지 확인
        if (today.getTime() === pullDate.getTime()) {
          return userData.remainingPulls || 0;
        }
      }
    }
    return 3; // 기본 하루 3회
  } catch (error) {
    console.error('뽑기 횟수 확인 오류:', error);
    return 3; // 오류 시 기본값
  }
};

// 뽑기 횟수 업데이트 함수
const updatePulls = async (userId: string, remainingPulls: number) => {
  try {
    const { db } = await getFirebaseInstance();
    await setDoc(doc(db, 'fortuneUsers', userId), {
      remainingPulls,
      lastPullDate: new Date()
    }, { merge: true });
  } catch (error) {
    console.error('뽑기 횟수 업데이트 오류:', error);
  }
};

export default function Fortune() {
  const { characters } = useGameStore();
  const [fortune, setFortune] = useState<{
    character: FortuneCharacter;
    message: string;
    type: string;
    emoji: string;
    rank: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false); // 공유 중 상태 추가
  const [remainingPulls, setRemainingPulls] = useState(0); // 남은 뽑기 횟수
  const [showFortuneResult, setShowFortuneResult] = useState(false); // 운세 결과 표시 여부
  const [pulledThisSession, setPulledThisSession] = useState(false); // 이번 세션에 뽑기 수행 여부
  
  // MZ 세대를 위한 운세 생성 함수
  const generateFortune = (character: FortuneCharacter) => {
    // character가 undefined인 경우 기본 캐릭터 사용
    if (!character || !character.name) {
      character = DEFAULT_CHARACTER;
    }
    
    // 랭크 가져오기
    const rank = getCharacterRank(character.id);
    
    // 랭크 기반 메시지 생성 (캐릭터 특성 반영)
    const message = getRankMessage(character);
    
    // 랜덤 운세 유형 선택
    const fortuneType = FORTUNE_TYPES[Math.floor(Math.random() * FORTUNE_TYPES.length)];
    
    return {
      character,
      message,
      type: fortuneType.type,
      emoji: fortuneType.emoji,
      rank: rank
    };
  };

  // 뽑기 가능 횟수와 이전 뽑기 기록 확인 함수
  const checkPullsRemaining = async () => {
    try {
      // 오늘 날짜 구하기 (YYYY-MM-DD 형식)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateStr = today.toISOString().split('T')[0];
      
      // 사용자별 뽑기 기록 (로컬 스토리지 사용)
      const pullsKey = `fortune_pulls_${dateStr}`;
      const pullsHistory = JSON.parse(localStorage.getItem(pullsKey) || '{"count": 0, "results": []}');
      
      // 남은 뽑기 횟수 계산 (하루 최대 3회)
      const remaining = Math.max(0, 3 - pullsHistory.count);
      setRemainingPulls(remaining);
      
      // 오늘 이미 뽑기를 한 경우 마지막 결과 표시
      if (pullsHistory.count > 0 && pullsHistory.results.length > 0) {
        const lastResult = pullsHistory.results[pullsHistory.results.length - 1];
        setFortune(lastResult);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("뽑기 기록 확인 중 오류 발생:", error);
      setRemainingPulls(3); // 오류 시 기본값
      setLoading(false);
    }
  };

  // 운세 뽑기 함수
  const pullFortune = async () => {
    if (remainingPulls <= 0) {
      alert("오늘의 뽑기 횟수를 모두 사용했습니다. 내일 다시 시도해주세요!");
      return;
    }
    
    setLoading(true);
    
    try {
      // 무작위 캐릭터 선택 (QUIZ_CHARACTERS 우선 사용)
      let selectedCharacter: FortuneCharacter;
      
      if (QUIZ_CHARACTERS.length > 0) {
        // 퀴즈 캐릭터 중에서 선택
        selectedCharacter = QUIZ_CHARACTERS[Math.floor(Math.random() * QUIZ_CHARACTERS.length)];
      } else if (characters && characters.length > 0) {
        // 게임 캐릭터 중에서 선택
        selectedCharacter = selectRandomCharacter(characters);
      } else {
        // 둘 다 없으면 기본 캐릭터 사용
        console.warn("캐릭터 목록이 비어있어 기본 캐릭터를 사용합니다.");
        selectedCharacter = DEFAULT_CHARACTER;
      }
      
      // 운세 생성
      const newFortune = generateFortune(selectedCharacter);
      
      // 로컬 스토리지에 저장
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateStr = today.toISOString().split('T')[0];
      const pullsKey = `fortune_pulls_${dateStr}`;
      const pullsHistory = JSON.parse(localStorage.getItem(pullsKey) || '{"count": 0, "results": []}');
      
      pullsHistory.count += 1;
      pullsHistory.results.push(newFortune);
      
      localStorage.setItem(pullsKey, JSON.stringify(pullsHistory));
      
      // 상태 업데이트
      setFortune(newFortune);
      setRemainingPulls(prev => Math.max(0, prev - 1));
      setShowFortuneResult(true);
      setPulledThisSession(true);
      
      setLoading(false);
    } catch (error) {
      console.error("운세 뽑기 중 오류 발생:", error);
      setError("운세 뽑기에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  };

  // 초기 로딩
  useEffect(() => {
    checkPullsRemaining();
  }, []);

  // 공유 함수
  const handleShare = async () => {
    if (!fortune || isSharing) return;
    
    setIsSharing(true);
    
    try {
      const rankEmoji = {
        'GOATED': '🔥🔥🔥',
        'GREAT': '🔥🔥',
        'GOOD': '🔥',
        'MID': '😊',
        'MEH': '😐',
        'BAD': '😢',
        'TERRIBLE': '💀'
      };
      
      const shareText = `[오늘의 운세 ${rankEmoji[fortune.rank as keyof typeof rankEmoji] || '✨'}]\n${fortune.character?.name} (${fortune.rank} 랭크)\n${fortune.message}\n\n#이탈리안브레인롯 #오늘의운세 #${fortune.type}운세`;
      
      if (navigator.share) {
        await navigator.share({
          title: `오늘의 운세 ${fortune.emoji}`,
          text: shareText,
          url: window.location.href
        });
      } else {
        // 클립보드에 복사
        await navigator.clipboard.writeText(shareText);
        alert('운세가 클립보드에 복사되었습니다.');
      }
    } catch (error) {
      console.error('공유 실패:', error);
      // share canceled 오류는 무시 (사용자가 공유를 취소한 경우)
      if (error instanceof Error && error.message !== 'Share canceled') {
        alert('공유하기에 실패했습니다.');
      }
    } finally {
      // 약간의 지연 후 공유 상태 초기화 (연속 클릭 방지)
      setTimeout(() => {
        setIsSharing(false);
      }, 1000);
    }
  };

  // 랭크 뱃지 디자인 함수
  const getRankBadgeStyle = (rank: string) => {
    const styles = {
      'GOATED': 'bg-gradient-to-r from-red-500 to-yellow-500 border-yellow-300 shadow-yellow-200',
      'GREAT': 'bg-gradient-to-r from-yellow-400 to-orange-500 border-orange-300 shadow-orange-200',
      'GOOD': 'bg-gradient-to-r from-green-400 to-teal-500 border-green-300 shadow-green-200',
      'MID': 'bg-gradient-to-r from-blue-400 to-teal-500 border-blue-300 shadow-blue-200',
      'MEH': 'bg-gradient-to-r from-indigo-400 to-purple-400 border-indigo-300 shadow-indigo-200',
      'BAD': 'bg-gradient-to-r from-purple-400 to-pink-400 border-purple-300 shadow-purple-200',
      'TERRIBLE': 'bg-gradient-to-r from-red-400 to-pink-500 border-red-300 shadow-red-200'
    };
    return styles[rank as keyof typeof styles] || 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-300';
  };

  // 랭크 설명 함수
  const getRankDescription = (rank: string) => {
    const descriptions = {
      'GOATED': '압도적인 에너지! 오늘은 모든 것이 완벽할 것입니다.',
      'GREAT': '훌륭한 기운이 감돌고 있어요. 행운이 함께할 거예요.',
      'GOOD': '좋은 에너지로 오늘 하루가 순조롭게 흘러갈 거예요.',
      'MID': '평범하지만 나쁘지 않은 하루가 될 것 같아요.',
      'MEH': '약간 미묘한 에너지... 기대는 적당히 하는 게 좋겠어요.',
      'BAD': '조심해야 할 날이에요. 위험한 선택은 피하세요.',
      'TERRIBLE': '오늘은 큰 도전이나 중요한 결정을 피하는 게 좋겠어요.'
    };
    return descriptions[rank as keyof typeof descriptions] || '오늘의 운세를 확인해보세요.';
  };

  const getRankEmoji = (rank: string) => {
    const emojis = {
      'GOATED': '👑🔥✨',
      'GREAT': '🌟⭐💫',
      'GOOD': '😊👍💪',
      'MID': '😉👌🙂',
      'MEH': '😐🤔😶',
      'BAD': '😓😕😬',
      'TERRIBLE': '💀⚡🌩️'
    };
    return emojis[rank as keyof typeof emojis] || '✨';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-xl text-red-500 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            checkPullsRemaining();
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
        >
          다시 시도
        </button>
      </div>
    );
  }

  const getRankColor = (rank: string) => {
    const colors = {
      'GOATED': 'from-red-500 to-yellow-500',
      'GREAT': 'from-yellow-400 to-orange-500',
      'GOOD': 'from-green-400 to-teal-500',
      'MID': 'from-teal-400 to-blue-500',
      'MEH': 'from-blue-400 to-indigo-500',
      'BAD': 'from-indigo-400 to-purple-500',
      'TERRIBLE': 'from-purple-500 to-pink-500'
    };
    return colors[rank as keyof typeof colors] || 'from-purple-500 to-pink-500';
  };

  return (
    <main className="min-h-screen p-4 md:p-8 pb-24 bg-gradient-to-b from-purple-50 to-pink-50">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 md:mb-4 text-purple-800">오늘의 운세</h1>
      <p className="text-center text-lg mb-4 text-purple-600">{new Date().toLocaleDateString()}</p>
      
      {!showFortuneResult ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-md mx-auto bg-white rounded-xl shadow-xl overflow-hidden p-6 md:p-8 text-center"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2 text-purple-800">이탈리안 브레인롯 운세</h2>
            <p className="text-purple-600 text-sm mb-6">최고의 캐릭터들이 당신의 운세를 알려드립니다!</p>
            
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <p className="font-bold text-lg mb-2 text-purple-800">오늘 남은 뽑기</p>
              <div className="flex justify-center gap-2 mb-1">
                {[...Array(3)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      i < remainingPulls 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-md' 
                        : 'bg-gray-300'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500">매일 3번의 기회가 주어집니다</p>
            </div>
          </div>
          
          {remainingPulls > 0 ? (
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(146, 64, 213, 0.4)" }}
              whileTap={{ scale: 0.95 }}
              onClick={pullFortune}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-xl text-xl font-medium shadow-lg transition-all w-full md:w-auto"
            >
              운세 뽑기
            </motion.button>
          ) : (
            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <p className="text-lg text-gray-700 mb-2">오늘은 더 이상 뽑기가 불가능합니다.</p>
              <p className="text-sm text-gray-500">내일 다시 찾아오세요!</p>
            </div>
          )}
          
          {fortune && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="mt-8 pt-6 border-t border-gray-200"
            >
              <p className="text-purple-800 font-semibold mb-2">이전 결과</p>
              <div className="bg-purple-50 rounded-lg p-4 mb-4 flex items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-3 flex-shrink-0 border-2 border-purple-200">
                  {fortune.character?.imageUrl ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <img
                        src={fortune.character.imageUrl}
                        alt={fortune.character.name || '운세 캐릭터'}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-xl">{fortune.emoji}</span>
                    </div>
                  )}
                </div>
                <div className="text-left overflow-hidden flex-1">
                  <div className="flex items-center mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${getRankBadgeStyle(fortune.rank)} text-white mr-2 flex-shrink-0`}>
                      {fortune.rank}
                    </span>
                    <span className="text-xs text-gray-500 truncate max-w-full block">{fortune.character?.name}</span>
                  </div>
                  <p className="text-sm text-gray-700 truncate">{fortune.message.substring(0, 30)}...</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowFortuneResult(true)}
                className="text-purple-600 hover:text-purple-800 font-medium bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg transition-all inline-flex items-center"
              >
                <span>전체 결과 보기</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      ) : fortune ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
          className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden"
          id="fortune-result-card"
        >
          <div className={`bg-gradient-to-r ${getRankColor(fortune.rank)} p-4 text-white text-center relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-white opacity-10" 
                style={{
                  backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }}
              />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center mb-1">
                <span className="text-xs font-bold px-3 py-1 bg-black bg-opacity-30 rounded-full mr-2 text-white">
                  {fortune.rank}
                </span>
                <span className="text-lg">{getRankEmoji(fortune.rank)}</span>
              </div>
              <h3 className="text-xl font-bold">{fortune.type} 운세</h3>
            </div>
          </div>
          
          <div className="p-6 md:p-8 text-center">
            <div className="relative">
              {/* 캐릭터 이미지 */}
              <div className="w-40 h-40 mx-auto mb-6 relative rounded-full overflow-hidden border-4 shadow-lg"
                style={{ 
                  borderColor: `${fortune.rank === 'GOATED' ? '#FFD700' : (fortune.rank === 'GREAT' ? '#FFA500' : (fortune.rank === 'GOOD' ? '#4CAF50' : (fortune.rank === 'TERRIBLE' ? '#FF2D55' : '#6366F1')))}`,
                  boxShadow: `0 0 20px 0 ${fortune.rank === 'GOATED' ? 'rgba(255, 215, 0, 0.5)' : (fortune.rank === 'GREAT' ? 'rgba(255, 165, 0, 0.5)' : (fortune.rank === 'GOOD' ? 'rgba(76, 175, 80, 0.5)' : (fortune.rank === 'TERRIBLE' ? 'rgba(255, 45, 85, 0.5)' : 'rgba(99, 102, 241, 0.3)')))}`
                }}
              >
                {fortune.character?.imageUrl ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <img
                      src={fortune.character.imageUrl}
                      alt={fortune.character.name || '운세 캐릭터'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl">{fortune.emoji}</span>
                  </div>
                )}
                
                {/* 랭크 뱃지 */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-full shadow-md border"
                  style={{ 
                    borderColor: `${fortune.rank === 'GOATED' ? '#FFD700' : (fortune.rank === 'GREAT' ? '#FFA500' : (fortune.rank === 'GOOD' ? '#4CAF50' : (fortune.rank === 'TERRIBLE' ? '#FF2D55' : '#6366F1')))}`,
                  }}
                >
                  <span className={`text-xs font-bold ${getRankBadgeStyle(fortune.rank)} px-2 py-0.5 rounded text-white`}>
                    {fortune.rank}
                  </span>
                </div>
              </div>
            
              {/* 캐릭터 이름과 설명 */}
              <div className="mb-4">
                <h2 className="text-xl md:text-2xl font-bold mb-2 text-purple-800 break-words px-4">{fortune.character?.name || '미스테리 캐릭터'}</h2>
                <p className="text-sm text-gray-500 mb-4">{getRankDescription(fortune.rank)}</p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-5 rounded-xl mb-6 shadow-inner">
                <p className="text-lg md:text-xl leading-relaxed text-gray-800">{fortune.message}</p>
              </div>
            
              {/* 고급 액션 버튼 영역 */}
              <div className="mt-6 relative">
                <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-purple-100 shadow-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                  
                    {/* 인스타 공유 버튼 */}
                    <motion.div
                      className="col-span-1 sm:col-span-2 flex-1"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="w-full h-full min-h-[100px] bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white rounded-xl px-6 py-4 flex flex-col items-center justify-center shadow-md hover:shadow-lg hover:from-pink-600 hover:to-fuchsia-600 transition-all disabled:opacity-70"
                      >
                        {isSharing ? (
                          <>
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-2"></div>
                            <span className="text-lg font-medium">공유 중...</span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                            </svg>
                            <span className="text-lg font-medium">인스타 공유</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                    
                    {/* 다시 뽑기 / 돌아가기 버튼 */}
                    <motion.div
                      className="flex-1"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <button
                        onClick={() => {
                          if (pulledThisSession && remainingPulls > 0) {
                            // 이번 세션에 뽑기를 했고 남은 뽑기가 있으면 뽑기 화면으로
                            setShowFortuneResult(false);
                          } else if (remainingPulls > 0) {
                            // 이번 세션에 뽑기를 안했고 남은 뽑기가 있으면 바로 뽑기 실행
                            pullFortune();
                          } else {
                            // 남은 뽑기가 없으면 뽑기 화면으로
                            setShowFortuneResult(false);
                          }
                        }}
                        className={`w-full h-full min-h-[100px] text-white rounded-xl px-6 py-4 flex flex-col items-center justify-center shadow-md hover:shadow-lg transition-all ${
                          remainingPulls > 0
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600'
                            : 'bg-gradient-to-r from-gray-500 to-slate-500 hover:from-gray-600 hover:to-slate-600'
                        }`}
                      >
                        {remainingPulls > 0 ? (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M10.146 8.746a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-3 3a.5.5 0 11-.708-.708L12.793 12l-2.647-2.646a.5.5 0 010-.708z" clipRule="evenodd" />
                            </svg>
                            <span className="text-lg font-medium">
                              {pulledThisSession ? "다시 뽑기" : "새 운세 뽑기"}
                            </span>
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                            </svg>
                            <span className="text-lg font-medium">돌아가기</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  </div>
                </div>
              </div>
            
              <p className="mt-6 text-sm text-gray-500">
                {remainingPulls > 0 ? (
                  <span>오늘 남은 뽑기: <span className="font-semibold text-purple-600">{remainingPulls}회</span></span>
                ) : (
                  <span>내일 다시 찾아오세요!</span>
                )}
              </p>
            
              {fortune.rank === 'GOATED' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-sm text-yellow-800"
                >
                  <span className="font-bold">축하합니다!</span> 가장 희귀한 GOATED 등급 캐릭터를 뽑으셨습니다! 🎉
                </motion.div>
              )}
            
              {/* 캐릭터 정보 추가 */}
              {fortune.character && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold mb-2 text-purple-800">캐릭터 정보</h3>
                  <p className="text-gray-700 mb-4">{fortune.character.description}</p>
                  <Link href="/characters" className="text-purple-600 hover:text-purple-800 font-medium bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg transition-all inline-flex items-center">
                    <span>모든 캐릭터 보기</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-xl">아직 운세를 뽑지 않았습니다.</p>
        </div>
      )}
    </main>
  );
} 