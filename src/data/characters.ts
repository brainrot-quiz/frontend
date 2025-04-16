export interface Character {
  id: string;
  name: string;
  description?: string;
  image?: string;
}

export const characters: Character[] = [
  {
    id: 'tralalero',
    name: 'Tralalero Tralala',
    description: '파도조종, 빠른 달리기 속도, 슈퍼 점프, 강한 저작력을 가진 상어 캐릭터. 나이키 운동화를 신고 있으며, Italian Brainrot에서 가장 유명한 캐릭터입니다. 아들들과 포트나이트를 즐기는 것이 취미입니다.',
    image: 'Tralalero Tralala .webp'
  },
  {
    id: 'bombardiro',
    name: 'Bombardiro Crocodilo',
    description: '폭격과 비행 능력을 가진 악어와 폭격기를 합성한 캐릭터. Tralalero tralala 다음으로 유명합니다. 상공에서 폭탄을 떨어뜨리는 공격 방식을 사용합니다.',
    image: 'Bombardiro Crocodilo .webp'
  },
  {
    id: 'bombombini',
    name: 'Bombombini Gusini',
    description: '폭격과 비행 능력을 가진 거위와 제트 전투기를 합성한 캐릭터. Bombardiro Crocodilo와 형제 관계이며 마찬가지로 폭격하는 것이 취미입니다.',
    image: 'Bombombini Gusini .webp'
  },
  {
    id: 'tripi',
    name: 'Tripi Tropi',
    description: '빠른 헤엄, 파동, 해일, 고양이 음파, 물기 능력을 가진 캐릭터. 새우와 고양이를 합친 모습을 하고 있습니다.',
    image: 'Trippi Troppi .webp'
  },
  {
    id: 'burbaloni',
    name: 'Burbaloni Luliloli',
    description: '수영을 잘하는 코코넛 안에 카피바라가 들어있는 캐릭터. 발리 해안가에서 발견되면 지역 주민들이 모닥불 주위에 모여 도착을 축하합니다.',
    image: 'Burbaloni Lulilolli .webp'
  },
  {
    id: 'tracotocutulo',
    name: 'Tracotocutulo Lirilì Larilà',
    description: '시간 정지 능력을 가진 샌들을 신고 몸이 선인장인 코끼리 캐릭터. 가지고 있는 시계로 전투에서 시간을 멈출 수 있습니다. 코끼리 특유의 체격과 긴 코를 활용한 기술적 싸움에 강합니다.',
    image: 'Lirilì Larilà .webp'
  },
  {
    id: 'brr',
    name: 'Brr Brr Patapim',
    description: '숲 조종 능력, 함정 설치, 상대를 나무로 바꾸는 능력을 가진 캐릭터. 나무 팔다리에 코주부원숭이의 머리가 달린 모습입니다. 숲을 지키며 나무의 뿌리로 침입자를 공격합니다.',
    image: 'Brr Brr Patapim .webp'
  },
  {
    id: 'trulimero',
    name: 'Trulimero Trulicina',
    description: '수영을 잘하는 물고기의 몸통에 고양이의 머리, 사람의 다리 4개가 붙어있는 캐릭터입니다.',
    image: 'Trulimero Trulicina .webp'
  },
  {
    id: 'frigo',
    name: 'Frigo Camello',
    description: '찬 바람 내뱉기 능력을 가진 냉장고 몸통을 한 낙타 캐릭터. 신발을 신고 있으며, 입에서 찬 바람이 나옵니다. 가끔 자신까지 얼려버리기도 합니다.',
    image: 'Frigo Camelo .webp'
  },
  {
    id: 'frulli',
    name: 'Frulli Frulla',
    description: '쪼기, 커피 마시기 능력을 가진 동그란 고글을 쓴 조류 캐릭터입니다.',
    image: 'Fruli Frula .webp'
  },
  {
    id: 'vaca',
    name: 'La Vaca Saturno Saturnita',
    description: '행복 전파, 우주 비행, 브레스 분사 능력을 가진 캐릭터. 토성의 몸통에 사람의 발, 소의 머리를 하고 있습니다. 한 걸음마다 춤처럼 보이며 사람들을 즐겁게 만듭니다.',
    image: 'La Vaca Saturno Saturnita .webp'
  },
  {
    id: 'bobritto',
    name: 'Bobritto Bandito',
    description: '총기 난사 능력을 가진 중절모를 쓰고 토미건을 든 비버 캐릭터. 은행을 털며 언제나 총기를 들고 담배를 물고 있습니다. 아마도 갱스터 조직원인 것 같습니다.',
    image: 'Bobrito bandito .webp'
  },
  {
    id: 'giraffa',
    name: 'Giraffa Celeste',
    description: '수박씨를 초속 50km로 뱉는 능력을 가진 수박, 기린, 우주인을 모티브로 한 캐릭터입니다.',
    image: 'Girafa Celestre .webp'
  },
  {
    id: 'cappuccino',
    name: 'Cappuccino Assassino',
    description: '빠른 속도, 카타나 휘두르기, 은신 능력을 가진 카푸치노 커피에 서클렛, 칼, 팔다리가 달린 암살자 캐릭터. 물속에서도 매우 빠른 속도로 움직입니다.',
    image: 'Cappuccino Assassino .webp'
  },
  {
    id: 'glorbo',
    name: 'Glorbo Fruttodrillo',
    description: '깨물기 능력을 가진 수박에 악어의 머리와 다리가 달린 캐릭터. 주로 늪지대에 서식하며, 몸무게는 304kg입니다.',
    image: 'Glorbo Fruttodrillo .webp'
  },
  {
    id: 'blueberrinni',
    name: 'Blueberrinni Octopussini',
    description: '발판공격, 빠른 수영 능력을 가진 상반신이 블루베리인 문어 캐릭터. 블루베리만큼 작아서 공격을 피하기 쉽습니다.',
    image: 'Blueberrinni Octopussini .webp'
  },
  {
    id: 'svinino',
    name: 'Svinino Bombondino',
    description: '자폭 능력을 가진 돼지와 폭탄을 합성한 캐릭터입니다.',
    image: 'Svinino Bombondino .webp'
  },
  {
    id: 'ballerina',
    name: 'Ballerina Cappuccina',
    description: '발레 능력을 가진 머리는 카푸치노이며, 분홍색 치마를 입은 발레리나 캐릭터. Cappuccino Assassino의 아내로, 음악을 사랑합니다.',
    image: 'Ballerina Cappuccina .webp'
  },
  {
    id: 'brii',
    name: 'Brii Brii Bicus Dicus Bombicus',
    description: '검술 능력을 가진 켄투리오 복장을 하고 목에 산딸기를 두른 조류 캐릭터. 체구는 작지만 자존심이 매우 큽니다.',
    image: 'Brii Brii Bicus Dicus Bombicus .webp'
  },
  {
    id: 'talpa',
    name: 'Talpa Di Ferro',
    description: '주변 탐색, 스캔, 드릴 능력을 가진 몸 여러 부위가 기계화된 쥐 캐릭터. 눈과 이마에 스캔용 마이크로칩이 있고, 코에는 어떤 단단한 물체도 뚫을 수 있는 드릴이 있습니다.',
    image: 'Talpa Di Ferro .webp'
  },
  {
    id: 'cacto',
    name: 'Il Cacto Hipopotamo',
    description: '밟기 능력을 가진 선인장 몸통에 하마의 머리를 하고 샌들을 신고 있는 캐릭터입니다.',
    image: 'Il Cacto Hipopotamo .webp'
  },
  {
    id: 'chef',
    name: 'Chef Crabracadabra',
    description: '저주의 요리 능력을 가진 게의 머리와 집게가 달린 요리사 캐릭터. 원래는 어부였으나 바다 마녀와의 계약 후 게가 되었습니다. 집게로 무엇이든 찢고 차원의 포탈을 열 수 있습니다.',
    image: 'Chef Crabracadabra .webp'
  },
  {
    id: 'chimpanzini',
    name: 'Chimpanzini Bananini',
    description: '민첩함, 바나나 벗기 능력을 가진 바나나 안에 초록색 침팬지가 들어간 캐릭터. 바나나를 벗으면 강력한 근육질 원숭이가 나옵니다.',
    image: 'Chimpanzini Bananini .webp'
  },
  {
    id: 'garamaraman',
    name: 'Garamaraman dan Madudungdung tak tuntung perkuntung',
    description: '소금 통과 꿀단지에 사람의 얼굴과 발을 합성한 캐릭터. 소금 통의 이름은 가라마라만, 꿀 통의 이름은 만두둥둥입니다. 원래는 사람이었으나 저주에 걸려 변했습니다.',
    image: 'Garamaraman dan Madudungdung tak tuntung perkuntung .webp'
  },
  {
    id: 'pothotspot',
    name: 'Pot hotspot',
    description: '핫스팟 요청, 무한으로 과자 사먹기 능력을 가진 해골과 핸드폰, 와이파이를 합성한 캐릭터. "Hotspot bro"라는 말을 자주 합니다.',
    image: 'Pot hotspot .webp'
  },
  {
    id: 'tung',
    name: 'Tung Tung Tung Tung Tung Tung Tung Tung Tung Sahur',
    description: '거인화, 야구방망이 스윙 능력을 가진 야구 방망이를 들고 있는 갈색 나무조각 캐릭터. 나무 갑옷을 장착한 거인으로 변신하는 능력이 있습니다.',
    image: 'Tung Tung Tung Tung Tung Tung Tung Tung Tung Sahur .webp'
  },
  {
    id: 'tata',
    name: 'Ta Ta Ta Ta Ta Ta Ta Ta Ta Ta Ta Sahur',
    description: '증기 생성, 굉장한 발차기 능력을 가진 주전자와 다리, 팔, 얼굴을 합성한 캐릭터. 항상 울상이며 슬플 때 주전자 입구에서 증기가 나옵니다.',
    image: 'Ta Ta Ta Ta Ta Ta Ta Ta Ta Ta Ta Sahur .webp'
  },
  {
    id: 'udin',
    name: 'U Din Din Din Din Dun Ma Din Din Din Dun',
    description: '반복되는 소리로 노래하는 캐릭터로 U Din Din Din Din Dun Ma Din Din Din Dun이라는 이름을 가지고 있습니다. 중독성 있는 멜로디가 특징입니다.',
    image: 'U Din Din Din Din Dun Ma Din Din Din Dun .webp'
  },
  {
    id: 'trippa',
    name: 'Troppa Trippa',
    description: '뒤집힌 트로파 트리파 캐릭터로 세상을 거꾸로 보는 독특한 시각을 가지고 있습니다.',
    image: 'Troppa Trippa.webp'
  },
  {
    id: 'boneca',
    name: 'Boneca Ambalabu',
    description: '높은 점프 능력, 강한 발차기, 긴 혀를 가진 머리는 개구리, 몸통은 타이어, 다리는 사람 다리인 캐릭터. 기름을 넣다가 갑자기 석유가 쏟아져 이렇게 변했다는 설정이 있습니다.',
    image: 'Boneca Ambalabu .webp'
  },
  {
    id: 'bombardiere',
    name: 'Bombardiere Lucertola',
    description: '폭격, 비행, 위장 능력을 가진 폭격기와 도마뱀을 합성한 캐릭터. Bombardiro Crocodillo를 업그레이드하는 과정에서 개발되었습니다.',
    image: 'Bombardiere Lucertola .webp'
  },
  {
    id: 'trippatroppa',
    name: 'Trippa Troppa Tralala Lirilì Rilà Tung Tung Sahur Boneca Tung Tung Tralalelo Trippi Troppa Crocodina',
    description: '가장 유명한 캐릭터 6인방인 트리피 트로피, 트랄랄레로 트랄랄라, 리릴리 라릴라, 퉁 퉁 퉁 사후르, 보네카 암발라부, 봄바르디로 크로코딜로가 합쳐진 캐릭터로 italian brainrot의 최강자입니다.',
    image: 'Trippa Troppa Tralala Lirilì Rilà Tung Tung Sahur Boneca Tung Tung Tralalelo Trippi Troppa Crocodina .webp'
  }
];

export function getCharacterById(id: string): Character | undefined {
  return characters.find(character => character.id === id);
}

export function getRandomCharacters(count: number): Character[] {
  const shuffled = [...characters].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, characters.length));
} 