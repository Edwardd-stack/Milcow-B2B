import type { FarmCertification, LocalizedText } from '@milcow/shared';

export interface FarmSeed {
  key: string;
  name: LocalizedText;
  desc: LocalizedText;
  address: string;
  lat: number;
  lng: number;
  cowCount: number;
  dailyCapacityTon: number;
  certifications: FarmCertification[];
}

// Fictional farm names in real Korean dairy regions
export const FARMS: FarmSeed[] = [
  {
    key: 'pyeongchang',
    name: {
      ko: '평창 은빛들 목장',
      en: 'Pyeongchang Silverfield Farm',
      uz: 'Pxyonchxan Kumushdala fermasi',
    },
    desc: {
      ko: '해발 800m 고원 목초지에서 방목하는 목장입니다.',
      en: 'Pasture-raised herd on a highland meadow 800 m above sea level.',
      uz: 'Dengiz sathidan 800 m balandlikdagi yaylovda boqiladigan podalar.',
    },
    address: '강원특별자치도 평창군 대관령면',
    lat: 37.683,
    lng: 128.721,
    cowCount: 420,
    dailyCapacityTon: 12,
    certifications: ['HACCP', 'ANIMAL_WELFARE'],
  },
  {
    key: 'anseong',
    name: {
      ko: '안성 푸른언덕 목장',
      en: 'Anseong Green Hill Farm',
      uz: 'Anson Yashil tepalik fermasi',
    },
    desc: {
      ko: '수도권 최대 낙농 지역의 대형 목장입니다.',
      en: 'A large farm in the biggest dairy region near Seoul.',
      uz: 'Seul atrofidagi eng yirik sut hududidagi katta ferma.',
    },
    address: '경기도 안성시 일죽면',
    lat: 37.0078,
    lng: 127.2797,
    cowCount: 650,
    dailyCapacityTon: 18,
    certifications: ['HACCP'],
  },
  {
    key: 'hoengseong',
    name: {
      ko: '횡성 맑은샘 목장',
      en: 'Hoengseong Clearspring Farm',
      uz: 'Xvenson Tiniq buloq fermasi',
    },
    desc: {
      ko: '유기농 사료만 사용하는 유기농 인증 목장입니다.',
      en: 'Certified organic farm using only organic feed.',
      uz: 'Faqat organik ozuqa ishlatadigan sertifikatlangan organik ferma.',
    },
    address: '강원특별자치도 횡성군 공근면',
    lat: 37.4917,
    lng: 127.9852,
    cowCount: 210,
    dailyCapacityTon: 6,
    certifications: ['HACCP', 'ORGANIC'],
  },
  {
    key: 'gochang',
    name: {
      ko: '고창 해오름 목장',
      en: 'Gochang Sunrise Farm',
      uz: 'Gochxan Quyosh chiqishi fermasi',
    },
    desc: {
      ko: '서해안 갯벌 인근의 친환경 목장입니다.',
      en: 'Eco-friendly farm near the west-coast tidal flats.',
      uz: "G'arbiy qirg'oqdagi sayozliklar yaqinidagi ekologik ferma.",
    },
    address: '전북특별자치도 고창군 상하면',
    lat: 35.4358,
    lng: 126.702,
    cowCount: 380,
    dailyCapacityTon: 10,
    certifications: ['HACCP', 'ANIMAL_WELFARE'],
  },
  {
    key: 'paju',
    name: { ko: '파주 노을빛 목장', en: 'Paju Sunset Farm', uz: 'Paju Shafaq fermasi' },
    desc: {
      ko: '수도권 북부의 가족 경영 목장입니다.',
      en: 'Family-run farm in the north of the capital area.',
      uz: 'Poytaxt hududining shimolidagi oilaviy ferma.',
    },
    address: '경기도 파주시 적성면',
    lat: 37.76,
    lng: 126.78,
    cowCount: 160,
    dailyCapacityTon: 4,
    certifications: ['HACCP'],
  },
];
