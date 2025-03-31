import longcareData from '../data/longcare.json';

export interface Service {
  name: string;
  startDate: string;
  endDate: string;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface Facility {
  id: string;
  code: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  services: Service[];
  contractStartDate: string;
  contractEndDate: string;
  description?: string;
  facilities?: string[];
  location?: Location;
  images?: string[];
  distance?: string;
}

// longcare項目的接口
interface LongcareItem {
  機構名稱: string;
  機構代碼: string;
  機構種類: string;
  縣市: number;
  區: number;
  地址全址: string;
  經度: number;
  緯度: number;
  O_ABC: string;
  特約服務項目: string;
  特約縣市: number;
  特約區域: string;
  機構電話: string | null;
  電子郵件: string | null;
  機構負責人姓名: string;
  特約起日: number;
  特約迄日: number;
}

// 定義longcareData的類型
interface LongcareData {
  [key: string]: LongcareItem[];
}

// 緩存變數
let facilitiesCache: Facility[] | null = null;

// 將longcare數據轉換為應用程序中使用的Facility對象
const transformLongcareData = (): Facility[] => {
  // 獲取longcare.json中的第一個鍵（SQL查詢）
  const sqlQuery = Object.keys(longcareData)[0];
  // 使用類型斷言
  const typedLongcareData = longcareData as unknown as LongcareData;
  const longcareList = typedLongcareData[sqlQuery];
  
  // 將每個項目轉換為Facility對象
  return longcareList.map((item: LongcareItem, index: number) => {
    // 處理服務項目
    const services: Service[] = [];
    if (item.特約服務項目) {
      services.push({
        name: item.特約服務項目,
        startDate: formatDate(item.特約起日),
        endDate: formatDate(item.特約迄日)
      });
    }

    // 處理位置信息
    const location: Location = {
      lat: item.緯度 || 0,
      lng: item.經度 || 0
    };

    return {
      id: String(index + 1), // 使用索引作為ID
      code: item.機構代碼 || '',
      name: item.機構名稱 || '',
      type: item.機構種類 || '',
      address: item.地址全址 || '',
      phone: item.機構電話 || '',
      email: item.電子郵件 || '',
      manager: item.機構負責人姓名 || '',
      services,
      contractStartDate: formatDate(item.特約起日),
      contractEndDate: formatDate(item.特約迄日),
      location,
      description: `${item.機構名稱}是一家位於${item.地址全址}的${getTypeDescription(item.機構種類)}，提供${item.特約服務項目}等服務。`,
    };
  });
};

// 格式化日期（將數字格式的日期轉換為yyyy-MM-dd格式）
const formatDate = (dateNum?: number): string => {
  if (!dateNum) return '';
  const dateStr = String(dateNum);
  if (dateStr.length !== 8) return '';
  
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  return `${year}-${month}-${day}`;
};

// 根據機構種類代碼獲取描述
const getTypeDescription = (typeCode: string): string => {
  const typeMap: {[key: string]: string} = {
    '1': '居家式服務類機構',
    'A1': '老人養護中心',
    'A3': '護理之家',
    'B1': '居家護理所',
    'B2': '醫院或診所',
    'BF': '社區發展協會',
    // 可以根據需要添加更多類型
  };
  
  return typeMap[typeCode] || '長照機構';
};

// 獲取所有設施
export const getAllFacilities = (): Facility[] => {
  // 延遲計算和緩存結果
  if (!facilitiesCache) {
    facilitiesCache = transformLongcareData();
  }
  return facilitiesCache;
};

// 根據ID獲取設施
export const getFacilityById = (id: string): Facility | null => {
  const facilities = getAllFacilities();
  const facility = facilities.find(f => f.id === id);
  return facility || null;
};

// 根據類型獲取設施
export const getFacilitiesByType = (type: string): Facility[] => {
  if (!type) return getAllFacilities();
  const facilities = getAllFacilities();
  return facilities.filter(f => f.type === type);
};

// 根據地區獲取設施
export const getFacilitiesByRegion = (region: string): Facility[] => {
  if (!region) return getAllFacilities();
  const facilities = getAllFacilities();
  return facilities.filter(f => f.address.includes(region));
};

// 根據服務類型獲取設施
export const getFacilitiesByService = (serviceName: string): Facility[] => {
  if (!serviceName) return getAllFacilities();
  const facilities = getAllFacilities();
  return facilities.filter(f => 
    f.services.some(service => service.name === serviceName)
  );
};

// 綜合篩選設施
export const filterFacilities = (
  type?: string, 
  region?: string, 
  serviceName?: string
): Facility[] => {
  let filteredFacilities = getAllFacilities();
  
  if (type) {
    filteredFacilities = filteredFacilities.filter(f => f.type === type);
  }
  
  if (region) {
    filteredFacilities = filteredFacilities.filter(f => f.address.includes(region));
  }
  
  if (serviceName) {
    filteredFacilities = filteredFacilities.filter(f => 
      f.services.some(service => service.name === serviceName)
    );
  }
  
  return filteredFacilities;
};

// 獲取所有設施類型
export const getAllFacilityTypes = (): string[] => {
  const facilities = getAllFacilities();
  const types = facilities.map(f => f.type);
  // 去重後轉換代碼為描述文字
  const uniqueTypes = [...new Set(types)];
  return uniqueTypes.map(type => getTypeDescription(type));
};

// 獲取所有服務類型
export const getAllServiceTypes = (): string[] => {
  const facilities = getAllFacilities();
  const serviceNames = facilities.flatMap(f => 
    f.services.map(service => service.name)
  );
  return [...new Set(serviceNames)]; // 去重
};

// 獲取所有地區
export const getAllRegions = (): string[] => {
  const facilities = getAllFacilities();
  // 從地址中提取縣市名稱
  const regions = facilities.map(f => {
    const address = f.address;
    if (!address) return '';
    
    // 嘗試提取縣市名稱
    const cityMatch = address.match(/^([^市縣]+[市縣])/);
    if (cityMatch && cityMatch[1]) {
      return cityMatch[1];
    }
    
    // 如果無法提取，則返回地址的前兩個字符
    return address.substring(0, 2);
  }).filter(r => r); // 過濾空值
  
  return [...new Set(regions)]; // 去重
}; 