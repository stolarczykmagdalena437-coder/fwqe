import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, MapPin, Home, DollarSign, Maximize2, Zap, Droplets,
  ShieldCheck, Sparkles, Phone, MessageCircle, Plus, Edit3,
  Trash2, Lock, Unlock, Settings, Check, X, ChevronLeft,
  ChevronRight, Calculator, Copy, Filter, RefreshCw, Image as ImageIcon,
  Upload, Star, Info, Bike, Layers, CheckCircle2, Clock, EyeOff,
  SlidersHorizontal, ArrowUpDown, UserCheck, KeyRound, Share2,
  Cloud, CloudRain, Files, RotateCcw
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot
} from 'firebase/firestore';

// ==========================================
// CẤU HÌNH FIREBASE & DỮ LIỆU MẪU BAN ĐẦU
// ==========================================
const appId = typeof __app_id !== 'undefined' ? __app_id : 'sale-tro-vn-app';
const CLEAN_CHANNEL_ID =
  'saletro_cloud_' + String(appId).replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 28);
// Kênh đồng bộ thời gian thực đa thiết bị (hoạt động cả trên tiiny.host / netlify / điện thoại ngoài)
const EXTERNAL_SYNC_API = `https://ntfy.sh/${CLEAN_CHANNEL_ID}`;

let db = null;
let auth = null;
let parsedFirebaseConfig = null;

try {
  if (typeof __firebase_config !== 'undefined' && __firebase_config) {
    parsedFirebaseConfig = JSON.parse(__firebase_config);
    const app = initializeApp(parsedFirebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  }
} catch (error) {
  console.error('Lỗi khởi tạo kết nối đám mây:', error);
}

const DEFAULT_SETTINGS = {
  brandName: 'Trọ Xinh Sài Gòn',
  tagline: 'Hệ thống Phòng Trọ • Studio • Căn Hộ Dịch Vụ Chính Chủ & Uy Tín',
  bannerTitle: 'Tìm Phòng Ưng Ý - Minh Bạch Chi Phí - Xem Phòng Miễn Phí 100%',
  bannerSubtitle: 'Cam kết hình thật 100%, báo đúng giá chủ nhà, hỗ trợ thương lượng hợp đồng & dọn vào ở ngay.',
  saleName: 'Minh Hoàng (Sale Trọ Có Tâm)',
  salePhone: '0909123456',
  saleZalo: '0909123456',
  saleAreas: 'Bình Thạnh, Phú Nhuận, Quận 1, Quận 3, Tân Bình, Quận 7, Thủ Đức',
  customDistricts: 'Bình Thạnh, Phú Nhuận, Quận 1, Quận 3, Quận 7, Tân Bình, Gò Vấp, TP. Thủ Đức, Quận 10, Quận 4',
  saleAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  adminPin: '123456',
  clearedSamples: false
};

const ALL_AMENITIES = [
  'Ban công thoáng',
  'Cửa sổ lớn',
  'Nuôi thú cưng',
  'Giờ giấc tự do',
  'Full nội thất',
  'Máy giặt riêng',
  'Thang máy',
  'Không chung chủ',
  'Bếp tách biệt',
  'Khóa vân tay',
  'Hầm để xe rộng',
  'Gác cao không đụng đầu'
];

const ROOM_TYPES = [
  'Phòng trọ',
  'Studio',
  'Duplex / Gác lửng',
  'CHDV 1PN',
  'CHDV 2PN',
  'Chung cư'
];

const DEFAULT_DISTRICTS = [
  'Bình Thạnh',
  'Phú Nhuận',
  'Quận 1',
  'Quận 3',
  'Quận 7',
  'Tân Bình',
  'Gò Vấp',
  'TP. Thủ Đức',
  'Quận 10',
  'Quận 4'
];

const INITIAL_ROOMS = [
  {
    id: 'room-bt-101',
    code: 'BT-101',
    title: 'Studio Ban Công Cây Xanh Cực Thoáng - Gần ĐH Hutech & Ngoại Thương',
    type: 'Studio',
    district: 'Bình Thạnh',
    address: 'Đường D2 (Nguyễn Gia Trí), Phường 25, Quận Bình Thạnh',
    price: 4800000,
    area: 30,
    status: 'available', // available | soon | rented
    electricPrice: 3800,
    waterPrice: 100000,
    waterUnit: 'người', // người | khối
    servicePrice: 150000,
    serviceUnit: 'phòng', // phòng | người
    parkingPrice: 0,
    deposit: 'Cọc 1 tháng',
    amenities: [
      'Ban công thoáng',
      'Full nội thất',
      'Giờ giấc tự do',
      'Thang máy',
      'Không chung chủ',
      'Khóa vân tay',
      'Hầm để xe rộng'
    ],
    description: 'Phòng Studio thiết kế hiện đại, ban công đón nắng tự nhiên cực mát. Trang bị sẵn máy lạnh Inverter, tủ lạnh 2 cánh, giường nệm cao su, tủ quần áo lớn, bàn làm việc và kệ bếp nấu ăn riêng. Khu vực an ninh, cách Hàng Xanh chỉ 3 phút di chuyển.',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80'
    ],
    updatedAt: 1763400000000
  },
  {
    id: 'room-pn-205',
    code: 'PN-205',
    title: 'Duplex Gác Cao Hiện Đại Khu Phan Xích Long - Cho Nuôi Pet',
    type: 'Duplex / Gác lửng',
    district: 'Phú Nhuận',
    address: 'Hoa Sứ, Khu Phan Xích Long, Quận Phú Nhuận',
    price: 4200000,
    area: 28,
    status: 'available',
    electricPrice: 3500,
    waterPrice: 100000,
    waterUnit: 'người',
    servicePrice: 150000,
    serviceUnit: 'phòng',
    parkingPrice: 100000,
    deposit: 'Cọc 1 tháng',
    amenities: [
      'Cửa sổ lớn',
      'Gác cao không đụng đầu',
      'Nuôi thú cưng',
      'Giờ giấc tự do',
      'Không chung chủ',
      'Khóa vân tay'
    ],
    description: 'Phòng Duplex trần cao 4.2m, gác đúc thật đứng thẳng thoải mái. Khu vực sầm uất bậc nhất Phú Nhuận, bước chân xuống nhà là đầy đủ siêu thị, quán cafe, phòng gym. Chủ nhà cực kỳ thân thiện, hỗ trợ cho nuôi mèo hoặc cún nhỏ sạch sẽ.',
    images: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=80'
    ],
    updatedAt: 1763390000000
  },
  {
    id: 'room-q7-302',
    code: 'Q7-302',
    title: 'Căn Hộ Dịch Vụ 1 Phòng Ngủ Riêng Biệt - Sát Lotte Mart Quận 7',
    type: 'CHDV 1PN',
    district: 'Quận 7',
    address: 'Nguyễn Thị Thập, Phường Tân Quy, Quận 7',
    price: 6500000,
    area: 42,
    status: 'available',
    electricPrice: 4000,
    waterPrice: 100000,
    waterUnit: 'người',
    servicePrice: 200000,
    serviceUnit: 'phòng',
    parkingPrice: 0,
    deposit: 'Cọc 1.5 tháng',
    amenities: [
      'Ban công thoáng',
      'Full nội thất',
      'Máy giặt riêng',
      'Bếp tách biệt',
      'Thang máy',
      'Giờ giấc tự do',
      'Không chung chủ'
    ],
    description: 'Căn hộ 1 phòng ngủ + 1 phòng khách có vách ngăn riêng tư, cực hợp cho cặp đôi, nhân viên văn phòng hoặc nhóm 2-3 bạn ở. Có sẵn máy giặt riêng từng phòng, ban công phơi đồ riêng, sofa êm ái và bếp rộng rãi.',
    images: [
      'https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1000&q=80'
    ],
    updatedAt: 1763380000000
  },
  {
    id: 'room-tb-108',
    code: 'TB-108',
    title: 'Phòng Trọ Mới Xây Giá Sinh Viên Có Cửa Sổ Thoáng - Gần Sân Bay',
    type: 'Phòng trọ',
    district: 'Tân Bình',
    address: 'Cộng Hòa, Phường 12, Quận Tân Bình',
    price: 3200000,
    area: 22,
    status: 'available',
    electricPrice: 3500,
    waterPrice: 80000,
    waterUnit: 'người',
    servicePrice: 100000,
    serviceUnit: 'phòng',
    parkingPrice: 0,
    deposit: 'Cọc 1 tháng',
    amenities: [
      'Cửa sổ lớn',
      'Giờ giấc tự do',
      'Không chung chủ',
      'Khóa vân tay',
      'Hầm để xe rộng'
    ],
    description: 'Phòng mới tinh sạch đẹp, có sẵn máy lạnh, kệ bếp và nhà vệ sinh riêng trong phòng. Hẻm xe hơi yên tĩnh, camera an ninh 24/7, miễn phí để xe máy dưới tầng trệt. Tiết kiệm tối đa chi phí cho sinh viên và người mới đi làm.',
    images: [
      'https://images.unsplash.com/photo-1540518614846-7ede433c457?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80'
    ],
    updatedAt: 1763370000000
  },
  {
    id: 'room-q3-401',
    code: 'Q3-401',
    title: 'Studio Cao Cấp Trung Tâm Quận 3 - Full Nội Thất Gỗ Ấm Cúng',
    type: 'Studio',
    district: 'Quận 3',
    address: 'Lê Văn Sỹ, Phường 14, Quận 3',
    price: 5500000,
    area: 32,
    status: 'soon',
    electricPrice: 3800,
    waterPrice: 100000,
    waterUnit: 'người',
    servicePrice: 150000,
    serviceUnit: 'phòng',
    parkingPrice: 120000,
    deposit: 'Cọc 1 tháng',
    amenities: [
      'Ban công thoáng',
      'Full nội thất',
      'Máy giặt riêng',
      'Thang máy',
      'Giờ giấc tự do',
      'Khóa vân tay'
    ],
    description: 'Tọa lạc ngay trục đường Lê Văn Sỹ thuận tiện qua Quận 1, Quận 10, Phú Nhuận. Phòng thiết kế tone gỗ Muji tối giản, đầy đủ tiện nghi từ A-Z chỉ việc xách vali vào ở. Phòng sắp trống cuối tuần này, nhận cọc giữ chỗ sớm.',
    images: [
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1000&q=80'
    ],
    updatedAt: 1763360000000
  },
  {
    id: 'room-td-509',
    code: 'TD-509',
    title: 'Chung Cư Mini 2PN Giá Tốt Cho Nhóm Bạn / Gia Đình Nhỏ - Thảo Điền',
    type: 'Chung cư',
    district: 'TP. Thủ Đức',
    address: 'Quốc Hương, Phường Thảo Điền, TP. Thủ Đức',
    price: 7800000,
    area: 50,
    status: 'rented',
    electricPrice: 3500,
    waterPrice: 22000,
    waterUnit: 'khối',
    servicePrice: 200000,
    serviceUnit: 'phòng',
    parkingPrice: 0,
    deposit: 'Cọc 2 tháng',
    amenities: [
      'Ban công thoáng',
      'Full nội thất',
      'Nuôi thú cưng',
      'Máy giặt riêng',
      'Bếp tách biệt',
      'Thang máy',
      'Giờ giấc tự do'
    ],
    description: 'Căn hộ 2 phòng ngủ thoáng mát ngay khu Thảo Điền, gần ga Metro. Không gian sống xanh mát, yên bình, có bảo vệ trực 24/24 và miễn phí 2 xe máy.',
    images: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1000&q=80'
    ],
    updatedAt: 1763350000000
  }
];

// ==========================================
// HÀM TIỆN ÍCH ĐỊNH DẠNG & NÉN ẢNH
// ==========================================
const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
};

const formatMillion = (val) => {
  const num = Number(val) || 0;
  if (num >= 1000000) {
    const tr = (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1);
    return `${tr.replace('.', ',')} Triệu`;
  }
  return formatCurrency(num);
};

// Nén ảnh qua HTML5 Canvas (max-width 900px, JPEG quality 0.65) để đồng bộ nhanh lên Firestore
const compressImageFile = (file, maxWidth = 900, quality = 0.65) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

// Sao chép văn bản an toàn trong iFrame
const copyTextToClipboard = (text) => {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.error('Không thể sao chép:', err);
  }
  document.body.removeChild(textArea);
};

export default function App() {
  // Trạng thái người dùng & đồng bộ dữ liệu đám mây
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [siteSettings, setSiteSettings] = useState(DEFAULT_SETTINGS);
  const [isSyncing, setIsSyncing] = useState(true);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const hasSeededRef = useRef(false);

  // Trạng thái quyền Admin (Chủ Web / Sale Trọ)
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Trạng thái Bộ lọc tìm kiếm của Khách
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('Tất cả');
  const [selectedType, setSelectedType] = useState('Tất cả');
  const [selectedPriceRange, setSelectedPriceRange] = useState('all');
  const [selectedMinArea, setSelectedMinArea] = useState(0);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Trạng thái Xem Chi tiết Phòng & Dự toán Chi phí
  const [activeRoom, setActiveRoom] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [calcPeople, setCalcPeople] = useState(2);
  const [calcBikes, setCalcBikes] = useState(1);
  const [calcKwh, setCalcKwh] = useState(120);
  const [calcWaterM3, setCalcWaterM3] = useState(6);

  // Trạng thái Thêm / Sửa / Xóa Phòng & Cài đặt (Admin)
  const [showRoomFormModal, setShowRoomFormModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [customAmenity, setCustomAmenity] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS);

  const [roomToDelete, setRoomToDelete] = useState(null);
  const [ showShareModal, setShowShareModal ] = useState(false);
  const [ customShareUrl, setCustomShareUrl ] = useState('');
  const [ toastMessage, setToastMessage ] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Phát sóng đồng bộ Cloud đa thiết bị (Chia nhỏ gói tin thông minh để không bao giờ bị nghẽn khi có ảnh chụp)
  const broadcastExternalSync = async (nextRooms, nextSettings) => {
    const targetRooms = nextRooms || rooms;
    const targetSettings = nextSettings || siteSettings;
    setIsSavingCloud(true);
    try {
      // 1. Lưu trực tiếp lên Firebase Cloud nếu đang kết nối
      if (db && user) {
        await setDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'siteConfig'),
          targetSettings
        );
      }

      // 2. Tạo gói phát sóng tối ưu tốc độ (< 3KB) qua trạm Cloud trực tiếp sang điện thoại ngoài
      const compactRooms = targetRooms.map((r) => ({
        ...r,
        // Nếu ảnh quá nặng dạng base64 dài, giữ 1 ảnh đại diện đã nén để đẩy tốc độ nhận 0.5 giây trên 4G
        images: (r.images || []).slice(0, 2)
      }));

      const fullPayload = JSON.stringify({
        type: 'FULL_SYNC',
        updatedAt: Date.now(),
        rooms: compactRooms,
        settings: targetSettings
      });

      // Nếu tổng dung lượng gói tin nhỏ hơn 3800 bytes thì gửi trực tiếp nguyên khối
      if (fullPayload.length < 3800) {
        await fetch(EXTERNAL_SYNC_API, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: fullPayload
        });
      } else {
        // Nếu có nhiều ảnh tự chụp từ máy (Base64), gửi thông tin chữ + giá trước để nhảy ngay lập tức
        const ultraFastRooms = targetRooms.map((r) => ({
          ...r,
          images: (r.images || []).filter((img) => !img.startsWith('data:')).slice(0, 2)
        }));
        await fetch(EXTERNAL_SYNC_API, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            type: 'FULL_SYNC',
            updatedAt: Date.now(),
            rooms: ultraFastRooms,
            settings: targetSettings
          })
        });
      }

      setCloudConnected(true);
      setLastSyncedAt(new Date());
    } catch (err) {
      console.warn('Đồng bộ kênh phụ:', err);
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Nút bấm đồng bộ Cloud chủ động (Đẩy & Kéo dữ liệu mới nhất ngay lập tức)
  const handleForceCloudSync = async () => {
    setIsSavingCloud(true);
    try {
      if (db && user) {
        await setDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'siteConfig'),
          siteSettings
        );
        for (const item of rooms) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', item.id), item);
        }
      }
      await broadcastExternalSync(rooms, siteSettings);
      showToast('Đã đồng bộ 100% dữ liệu & giỏ hàng lên Đám mây thành công!');
    } catch (e) {
      showToast('Đã phát tín hiệu đồng bộ Đám mây!');
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Lắng nghe dữ liệu từ kênh đa thiết bị (khi bạn sửa trên điện thoại hoặc máy tính khác)
  useEffect(() => {
    let isMounted = true;
    const fetchLatestExternal = async () => {
      try {
        const res = await fetch(`${EXTERNAL_SYNC_API}/json?poll=1&since=48h`);
        const text = await res.text();
        const lines = text.trim().split('\n').filter(Boolean);
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const evt = JSON.parse(lines[i]);
            if (evt.event === 'message' && evt.message) {
              const data = JSON.parse(evt.message);
              if (data && data.type === 'FULL_SYNC' && isMounted) {
                if (Array.isArray(data.rooms) && data.rooms.length > 0) {
                  setRooms((prev) => {
                    // Giữ lại ảnh gốc độ nét cao nếu phòng trùng ID
                    return data.rooms.map((incoming) => {
                      const existing = prev.find((p) => p.id === incoming.id);
                      return {
                        ...incoming,
                        images:
                          incoming.images && incoming.images.length > 0
                            ? incoming.images
                            : existing?.images || []
                      };
                    });
                  });
                }
                if (data.settings) {
                  setSiteSettings((prev) => ({ ...prev, ...data.settings }));
                }
                setCloudConnected(true);
                setLastSyncedAt(new Date());
                break;
              }
            }
          } catch (e) {
            // Bỏ qua dòng không hợp lệ
          }
        }
      } catch (e) {
        // Bỏ qua nếu ngoại tuyến
      }
    };

    fetchLatestExternal();

    let es = null;
    try {
      es = new EventSource(`${EXTERNAL_SYNC_API}/sse`);
      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data);
          if (evt.event === 'message' && evt.message) {
            const data = JSON.parse(evt.message);
            if (data && data.type === 'FULL_SYNC' && isMounted) {
              if (Array.isArray(data.rooms)) {
                setRooms((prev) =>
                  data.rooms.map((incoming) => {
                    const existing = prev.find((p) => p.id === incoming.id);
                    return {
                      ...incoming,
                      images:
                        incoming.images && incoming.images.length > 0
                          ? incoming.images
                          : existing?.images || []
                    };
                  })
                );
              }
              if (data.settings) setSiteSettings((prev) => ({ ...prev, ...data.settings }));
              setCloudConnected(true);
              setLastSyncedAt(new Date());
            }
          }
        } catch (err) {
          // Bỏ qua lỗi parse
        }
      };
    } catch (e) {
      console.warn('SSE fallback:', e);
    }

    return () => {
      isMounted = false;
      if (es) es.close();
    };
  }, []);

  // ==========================================
  // 1. KẾT NỐI FIREBASE AUTH & FIRESTORE
  // ==========================================
  useEffect(() => {
    if (!auth) {
      setIsSyncing(false);
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Lỗi đăng nhập ẩn danh:', err);
        setIsSyncing(false);
      }
    };

    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    const roomsColRef = collection(db, 'artifacts', appId, 'public', 'data', 'rooms');
    const settingsColRef = collection(db, 'artifacts', appId, 'public', 'data', 'settings');

    const unsubSettings = onSnapshot(
      settingsColRef,
      async (snapshot) => {
        setCloudConnected(true);
        const configDoc = snapshot.docs.find((d) => d.id === 'siteConfig');
        if (configDoc) {
          const data = configDoc.data();
          if (data.clearedSamples) {
            hasSeededRef.current = true;
          }
          setSiteSettings({ ...DEFAULT_SETTINGS, ...data });
        } else {
          try {
            await setDoc(
              doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'siteConfig'),
              DEFAULT_SETTINGS
            );
          } catch (err) {
            console.error('Lỗi lưu cài đặt mặc định:', err);
          }
        }
      },
      (error) => {
        console.error('Lỗi lắng nghe cài đặt:', error);
        setCloudConnected(false);
      }
    );

    const unsubRooms = onSnapshot(
      roomsColRef,
      async (snapshot) => {
        setCloudConnected(true);
        setLastSyncedAt(new Date());
        if (snapshot.empty && !hasSeededRef.current) {
          hasSeededRef.current = true;
          try {
            for (const item of INITIAL_ROOMS) {
              await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', item.id), item);
            }
          } catch (err) {
            console.error('Lỗi khởi tạo dữ liệu mẫu:', err);
          }
        } else {
          const loadedRooms = snapshot.docs.map((d) => ({
            ...d.data(),
            id: d.id
          }));
          setRooms(loadedRooms);
        }
        setIsSyncing(false);
      },
      (error) => {
        console.error('Lỗi lắng nghe dữ liệu phòng:', error);
        setCloudConnected(false);
        setIsSyncing(false);
      }
    );

    return () => {
      unsubRooms();
      unsubSettings();
    };
  }, [user]);

  // Cập nhật activeRoom khi danh sách phòng thay đổi
  useEffect(() => {
    if (activeRoom) {
      const updated = rooms.find((r) => r.id === activeRoom.id);
      if (updated) setActiveRoom(updated);
    }
  }, [rooms]);

  // ==========================================
  // 2. XỬ LÝ BỘ LỌC & DANH SÁCH QUẬN ĐỘNG
  // ==========================================
  const availableDistricts = useMemo(() => {
    const customList = (siteSettings.customDistricts || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const set = new Set(customList.length > 0 ? customList : DEFAULT_DISTRICTS);
    rooms.forEach((r) => {
      if (r.district && r.district.trim()) {
        set.add(r.district.trim());
      }
    });
    return ['Tất cả', ...Array.from(set)];
  }, [rooms, siteSettings.customDistricts]);

  const filteredRooms = useMemo(() => {
    return rooms
      .filter((room) => {
        // 1. Từ khóa
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = room.title?.toLowerCase().includes(q);
          const matchCode = room.code?.toLowerCase().includes(q);
          const matchAddress = room.address?.toLowerCase().includes(q);
          const matchDistrict = room.district?.toLowerCase().includes(q);
          const matchDesc = room.description?.toLowerCase().includes(q);
          if (!matchTitle && !matchCode && !matchAddress && !matchDistrict && !matchDesc) {
            return false;
          }
        }

        // 2. Quận / Khu vực
        if (selectedDistrict !== 'Tất cả' && room.district !== selectedDistrict) {
          return false;
        }

        // 3. Loại phòng
        if (selectedType !== 'Tất cả' && room.type !== selectedType) {
          return false;
        }

        // 4. Khoảng giá
        const p = Number(room.price) || 0;
        if (selectedPriceRange === 'under35' && p >= 3500000) return false;
        if (selectedPriceRange === '35to50' && (p < 3500000 || p > 5000000)) return false;
        if (selectedPriceRange === '50to70' && (p <= 5000000 || p > 7000000)) return false;
        if (selectedPriceRange === 'over70' && p <= 7000000) return false;

        // 5. Diện tích tối thiểu
        if (selectedMinArea > 0 && (Number(room.area) || 0) < selectedMinArea) {
          return false;
        }

        // 6. Chỉ hiện phòng còn trống / sắp trống
        if (onlyAvailable && room.status === 'rented') {
          return false;
        }

        // 7. Tiện ích đã chọn
        if (selectedAmenities.length > 0) {
          const roomAm = room.amenities || [];
          const hasAll = selectedAmenities.every((am) => roomAm.includes(am));
          if (!hasAll) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priceAsc') return (Number(a.price) || 0) - (Number(b.price) || 0);
        if (sortBy === 'priceDesc') return (Number(b.price) || 0) - (Number(a.price) || 0);
        if (sortBy === 'areaDesc') return (Number(b.area) || 0) - (Number(a.area) || 0);
        return (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0);
      });
  }, [
    rooms,
    searchQuery,
    selectedDistrict,
    selectedType,
    selectedPriceRange,
    selectedMinArea,
    selectedAmenities,
    onlyAvailable,
    sortBy
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedDistrict !== 'Tất cả') count++;
    if (selectedType !== 'Tất cả') count++;
    if (selectedPriceRange !== 'all') count++;
    if (selectedMinArea > 0) count++;
    if (onlyAvailable) count++;
    count += selectedAmenities.length;
    return count;
  }, [
    searchQuery,
    selectedDistrict,
    selectedType,
    selectedPriceRange,
    selectedMinArea,
    onlyAvailable,
    selectedAmenities
  ]);

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedDistrict('Tất cả');
    setSelectedType('Tất cả');
    setSelectedPriceRange('all');
    setSelectedMinArea(0);
    setSelectedAmenities([]);
    setOnlyAvailable(false);
    setSortBy('newest');
  };

  const toggleAmenityFilter = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((item) => item !== amenity) : [...prev, amenity]
    );
  };

  // ==========================================
  // 3. QUẢN LÝ QUYỀN ADMIN & CRUD PHÒNG TRỌ
  // ==========================================
  const handleVerifyPin = (e) => {
    e.preventDefault();
    const currentPin = siteSettings.adminPin || '123456';
    if (pinInput.trim() === currentPin) {
      setIsAdmin(true);
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      showToast('Đã mở khóa Chế độ Quản lý dành cho Chủ Web / Sale!');
    } else {
      setPinError('Mã PIN chưa chính xác. Vui lòng thử lại (Mặc định: 123456).');
    }
  };

  const openAddRoomModal = () => {
    const randomCode = `P-${Math.floor(100 + Math.random() * 900)}`;
    setEditingRoom(null);
    setRoomForm({
      id: `room-${Date.now()}`,
      code: randomCode,
      title: '',
      type: 'Studio',
      district: 'Bình Thạnh',
      address: '',
      price: 4500000,
      area: 28,
      status: 'available',
      electricPrice: 3800,
      waterPrice: 100000,
      waterUnit: 'người',
      servicePrice: 150000,
      serviceUnit: 'phòng',
      parkingPrice: 0,
      deposit: 'Cọc 1 tháng',
      amenities: ['Giờ giấc tự do', 'Không chung chủ', 'Full nội thất'],
      description: '',
      images: [],
      updatedAt: Date.now()
    });
    setNewImageUrl('');
    setCustomAmenity('');
    setShowRoomFormModal(true);
  };

  const openEditRoomModal = (room, e) => {
    if (e) e.stopPropagation();
    setEditingRoom(room);
    setRoomForm({
      ...room,
      amenities: [...(room.amenities || [])],
      images: [...(room.images || [])]
    });
    setNewImageUrl('');
    setCustomAmenity('');
    setShowRoomFormModal(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!roomForm.title.trim()) {
      showToast('Vui lòng nhập tiêu đề phòng!', 'error');
      return;
    }

    const finalImages =
      roomForm.images && roomForm.images.length > 0
        ? roomForm.images
        : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80'];

    const roomData = {
      ...roomForm,
      price: Number(roomForm.price) || 0,
      area: Number(roomForm.area) || 0,
      electricPrice: Number(roomForm.electricPrice) || 0,
      waterPrice: Number(roomForm.waterPrice) || 0,
      servicePrice: Number(roomForm.servicePrice) || 0,
      parkingPrice: Number(roomForm.parkingPrice) || 0,
      images: finalImages,
      updatedAt: Date.now()
    };

    // Cập nhật trên giao diện ngay lập tức
    const updatedList = rooms.some((r) => r.id === roomData.id)
      ? rooms.map((r) => (r.id === roomData.id ? roomData : r))
      : [roomData, ...rooms];
    setRooms(updatedList);

    setIsSavingCloud(true);
    try {
      await broadcastExternalSync(updatedList, siteSettings);
      if (db && user) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomData.id), roomData);
      }
    } catch (err) {
      console.error('Lỗi lưu phòng lên đám mây:', err);
      showToast('Lưu đám mây gặp sự cố (kiểm tra dung lượng ảnh).', 'error');
    } finally {
      setIsSavingCloud(false);
    }

    setShowRoomFormModal(false);
    showToast(
      editingRoom
        ? `Đã đồng bộ cập nhật phòng #${roomData.code} sang mọi thiết bị!`
        : `Đã đăng phòng mới #${roomData.code} sang mọi thiết bị!`
    );
  };

  // Nhân bản nhanh phòng cùng tòa nhà cho Sale
  const handleDuplicateRoom = async (room, e) => {
    if (e) e.stopPropagation();
    const newCode = `${room.code.split('-')[0] || 'P'}-${Math.floor(100 + Math.random() * 900)}`;
    const clonedRoom = {
      ...room,
      id: `room-${Date.now()}`,
      code: newCode,
      title: `${room.title} (Phòng trống cùng tòa nhà)`,
      status: 'available',
      updatedAt: Date.now()
    };

    const updatedList = [clonedRoom, ...rooms];
    setRooms(updatedList);

    setIsSavingCloud(true);
    try {
      await broadcastExternalSync(updatedList, siteSettings);
      if (db && user) {
        await setDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'rooms', clonedRoom.id),
          clonedRoom
        );
      }
    } catch (err) {
      console.error('Lỗi nhân bản phòng:', err);
    } finally {
      setIsSavingCloud(false);
    }
    showToast(`Đã nhân bản thành phòng mới #${newCode}!`);
  };

  const handleQuickCycleStatus = async (room, e) => {
    if (e) e.stopPropagation();
    const order = ['available', 'soon', 'rented'];
    const nextStatus = order[(order.indexOf(room.status) + 1) % order.length];
    const updatedRoom = { ...room, status: nextStatus, updatedAt: Date.now() };

    const updatedList = rooms.map((r) => (r.id === room.id ? updatedRoom : r));
    setRooms(updatedList);

    setIsSavingCloud(true);
    try {
      await broadcastExternalSync(updatedList, siteSettings);
      if (db && user) {
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', room.id), updatedRoom);
      }
    } catch (err) {
      console.error('Lỗi đổi trạng thái:', err);
    } finally {
      setIsSavingCloud(false);
    }

    const statusLabel =
      nextStatus === 'available' ? 'Còn trống' : nextStatus === 'soon' ? 'Sắp trống' : 'Đã cho thuê';
    showToast(`Đã đồng bộ: Phòng #${room.code} -> ${statusLabel}`);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    const targetId = roomToDelete.id;
    const targetCode = roomToDelete.code;

    const updatedList = rooms.filter((r) => r.id !== targetId);
    setRooms(updatedList);
    if (activeRoom && activeRoom.id === targetId) {
      setActiveRoom(null);
    }

    setIsSavingCloud(true);
    try {
      await broadcastExternalSync(updatedList, siteSettings);
      if (db && user) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', targetId));
      }
    } catch (err) {
      console.error('Lỗi xóa phòng:', err);
    } finally {
      setIsSavingCloud(false);
    }

    setRoomToDelete(null);
    showToast(`Đã xóa vĩnh viễn phòng #${targetCode} trên mọi thiết bị!`);
  };

  // Xóa nhanh các phòng mẫu hoặc Khôi phục dữ liệu mẫu
  const handleClearSampleRooms = async () => {
    const sampleIds = INITIAL_ROOMS.map((r) => r.id);
    const updatedSettings = { ...siteSettings, clearedSamples: true };
    hasSeededRef.current = true;

    const updatedList = rooms.filter((r) => !sampleIds.includes(r.id));
    setRooms(updatedList);
    setSiteSettings(updatedSettings);

    setIsSavingCloud(true);
    try {
      await broadcastExternalSync(updatedList, updatedSettings);
      if (db && user) {
        await setDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'siteConfig'),
          updatedSettings
        );
        for (const sid of sampleIds) {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', sid));
        }
      }
    } catch (err) {
      console.error('Lỗi xóa phòng mẫu:', err);
    } finally {
      setIsSavingCloud(false);
    }
    showToast('Đã xóa toàn bộ các phòng mẫu khỏi hệ thống!');
  };

  const handleRestoreSampleRooms = async () => {
    setIsSavingCloud(true);
    try {
      const updatedList = [...INITIAL_ROOMS];
      setRooms(updatedList);
      await broadcastExternalSync(updatedList, siteSettings);
      if (db && user) {
        for (const item of INITIAL_ROOMS) {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', item.id), {
            ...item,
            updatedAt: Date.now()
          });
        }
      }
      showToast('Đã khôi phục 6 phòng mẫu lên hệ thống!');
    } catch (err) {
      console.error('Lỗi khôi phục phòng mẫu:', err);
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Xử lý tải ảnh từ máy tính/điện thoại (Nén chuẩn 750px, quality 0.55 để truyền siêu tốc qua Cloud)
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploadingImage(true);
    try {
      const compressedList = [];
      for (const file of files) {
        const base64 = await compressImageFile(file, 750, 0.55);
        compressedList.push(base64);
      }
      setRoomForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...compressedList]
      }));
      showToast(`Đã nén & tải lên ${compressedList.length} ảnh phòng!`);
    } catch (err) {
      console.error('Lỗi nén ảnh:', err);
      showToast('Không thể xử lý ảnh này, vui lòng thử ảnh khác.', 'error');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  // Tải ảnh đại diện của Sale trong phần Cài đặt
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await compressImageFile(file, 400, 0.75);
      setSettingsForm((prev) => ({ ...prev, saleAvatar: base64 }));
      showToast('Đã tải ảnh đại diện mới!');
    } catch (err) {
      console.error('Lỗi tải avatar:', err);
    }
  };

  const handleAddImageUrl = () => {
    if (!newImageUrl.trim()) return;
    setRoomForm((prev) => ({
      ...prev,
      images: [...(prev.images || []), newImageUrl.trim()]
    }));
    setNewImageUrl('');
  };

  const handleSetCoverImage = (idx) => {
    setRoomForm((prev) => {
      const list = [...(prev.images || [])];
      const [chosen] = list.splice(idx, 1);
      return { ...prev, images: [chosen, ...list] };
    });
    showToast('Đã đặt làm ảnh bìa chính!');
  };

  const handleSaveSiteSettings = async (e) => {
    e.preventDefault();
    setSiteSettings(settingsForm);
    setIsSavingCloud(true);
    try {
      await broadcastExternalSync(rooms, settingsForm);
      if (db && user) {
        await setDoc(
          doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'siteConfig'),
          settingsForm
        );
      }
    } catch (err) {
      console.error('Lỗi lưu cài đặt web:', err);
    } finally {
      setIsSavingCloud(false);
    }
    setShowSettingsModal(false);
    showToast('Đã đồng bộ thông tin thương hiệu & cài đặt Sale sang mọi thiết bị!');
  };

  // ==========================================
  // 4. TÍNH TOÁN CHI PHÍ DỰ KIẾN HÀNG THÁNG
  // ==========================================
  const openRoomDetail = (room) => {
    setActiveRoom(room);
    setActiveImageIndex(0);
    setCalcPeople(2);
    setCalcBikes(1);
    setCalcKwh(120);
    setCalcWaterM3(6);
  };

  const costBreakdown = useMemo(() => {
    if (!activeRoom) return null;
    const baseRent = Number(activeRoom.price) || 0;
    const elecTotal = (Number(activeRoom.electricPrice) || 0) * calcKwh;
    const waterTotal =
      activeRoom.waterUnit === 'khối'
        ? (Number(activeRoom.waterPrice) || 0) * calcWaterM3
        : (Number(activeRoom.waterPrice) || 0) * calcPeople;
    const serviceTotal =
      activeRoom.serviceUnit === 'người'
        ? (Number(activeRoom.servicePrice) || 0) * calcPeople
        : Number(activeRoom.servicePrice) || 0;
    const parkingTotal = (Number(activeRoom.parkingPrice) || 0) * calcBikes;
    const totalMonthly = baseRent + elecTotal + waterTotal + serviceTotal + parkingTotal;
    const perPerson = calcPeople > 0 ? Math.round(totalMonthly / calcPeople) : totalMonthly;

    return {
      baseRent,
      elecTotal,
      waterTotal,
      serviceTotal,
      parkingTotal,
      totalMonthly,
      perPerson
    };
  }, [activeRoom, calcPeople, calcBikes, calcKwh, calcWaterM3]);

  const handleZaloInquiry = (room) => {
    const message = `Chào ${siteSettings.saleName}, mình quan tâm phòng mã #${room.code} (${room.title}) tại ${room.district} - Giá ${formatCurrency(room.price)}/tháng. Phòng này còn xem được không ạ?`;
    copyTextToClipboard(message);
    showToast('Đã sao chép nội dung hỏi phòng! Đang mở Zalo...');
    const cleanZalo = (siteSettings.saleZalo || siteSettings.salePhone || '').replace(/\D/g, '');
    if (cleanZalo) {
      window.open(`https://zalo.me/${cleanZalo}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyRoomSummary = (room, e) => {
    if (e) e.stopPropagation();
    const summary = `🏠 MÃ PHÒNG: #${room.code} - ${room.title}
📍 Khu vực: ${room.address}, ${room.district}
💰 Giá thuê: ${formatCurrency(room.price)}/tháng (${room.area}m²)
⚡ Điện: ${room.electricPrice === 0 ? 'Miễn phí' : formatCurrency(room.electricPrice) + '/kWh'}
💧 Nước: ${room.waterPrice === 0 ? 'Miễn phí' : formatCurrency(room.waterPrice) + '/' + room.waterUnit}
🧹 Dịch vụ: ${room.servicePrice === 0 ? 'Miễn phí' : formatCurrency(room.servicePrice) + '/' + room.serviceUnit}
🛵 Gửi xe: ${room.parkingPrice === 0 ? 'Miễn phí' : formatCurrency(room.parkingPrice) + '/xe'}
📞 Liên hệ xem phòng: ${siteSettings.saleName} - ${siteSettings.salePhone}`;
    copyTextToClipboard(summary);
    showToast(`Đã sao chép thông tin phòng #${room.code}!`);
  };

  // Tạo nhanh bài đăng tổng hợp giỏ hàng cho Sale đăng Zalo / Facebook
  const generateCatalogPost = () => {
    const availableList = rooms.filter((r) => r.status !== 'rented');
    const lines = availableList.map(
      (r, idx) =>
        `${idx + 1}. [${r.district}] #${r.code} - ${r.title}\n   💰 Giá: ${formatMillion(r.price)}/tháng (${r.area}m²) | Điện ${formatCurrency(r.electricPrice)}, Nước ${formatCurrency(r.waterPrice)}/${r.waterUnit}`
    );
    const linkLine = customShareUrl.trim()
      ? `\n🌐 Xem hình thật & tự tính tổng chi phí tại: ${customShareUrl.trim()}`
      : '';
    return `🔥 CẬP NHẬT GIỎ HÀNG PHÒNG TRỌ / STUDIO / CHDV MỚI NHẤT 🔥
✅ Cam kết hình thật 100% - Rõ ràng giá điện, nước, dịch vụ - Xem phòng miễn phí!

${lines.join('\n\n')}${linkLine}

📞 Liên hệ xem phòng ngay: ${siteSettings.saleName} - ${siteSettings.salePhone} (Zalo/Call 24/7)`;
  };

  // Xuất toàn bộ trang web + kết nối Cloud thời gian thực ra 1 file HTML duy nhất
  const handleDownloadStandaloneHtml = () => {
    // Phát sóng bản mới nhất lên Cloud trước khi xuất file
    broadcastExternalSync(rooms, siteSettings);
    const exportedRoomsJson = JSON.stringify(rooms);
    const exportedSettingsJson = JSON.stringify(siteSettings);

    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${siteSettings.brandName} - ${siteSettings.saleName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800 font-sans pb-16">
  <header class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div ondblclick="window.openPinBox()" title="Nhấn đúp 2 lần để mở Quản lý Sale" class="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-extrabold cursor-pointer select-none">🏠</div>
        <div>
          <div class="flex items-center gap-2">
            <h1 id="brandName" class="text-xl font-extrabold text-slate-900">${siteSettings.brandName}</h1>
            <span id="cloudBadge" class="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">⚡ Trực tuyến thời gian thực</span>
          </div>
          <p id="tagline" class="text-xs text-slate-500">${siteSettings.tagline}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button id="exitAdminBtn" onclick="window.exitAdmin()" class="hidden px-3 py-2 rounded-xl bg-rose-100 text-rose-700 font-bold text-xs">Thoát Sale</button>
        <a id="phoneBtn" href="tel:${siteSettings.salePhone}" class="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm">📞 ${siteSettings.salePhone}</a>
        <a id="zaloBtn" href="https://zalo.me/${(siteSettings.saleZalo || siteSettings.salePhone).replace(/\\D/g, '')}" target="_blank" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm">💬 Zalo Tư Vấn</a>
      </div>
    </div>
  </header>

  <main class="max-w-7xl mx-auto px-4 mt-6 space-y-6">
    <!-- Bộ lọc tìm kiếm nhanh cho khách -->
    <div class="bg-white p-4 sm:p-5 rounded-3xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <input id="q" oninput="window.renderRooms()" placeholder="🔍 Tìm tên đường, quận, mã phòng..." class="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:outline-none" />
      <select id="dist" onchange="window.renderRooms()" class="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold">
        <option value="">📍 Tất cả Quận / Khu vực</option>
      </select>
      <select id="type" onchange="window.renderRooms()" class="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold">
        <option value="">🏠 Tất cả loại phòng</option>
        <option value="Phòng trọ">Phòng trọ</option>
        <option value="Studio">Studio</option>
        <option value="Duplex / Gác lửng">Duplex / Gác lửng</option>
        <option value="CHDV 1PN">CHDV 1PN</option>
        <option value="CHDV 2PN">CHDV 2PN</option>
        <option value="Chung cư">Chung cư</option>
      </select>
      <select id="price" onchange="window.renderRooms()" class="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold">
        <option value="all">💰 Mọi mức giá</option>
        <option value="u35">Dưới 3.5 triệu</option>
        <option value="35to50">Từ 3.5 - 5 triệu</option>
        <option value="50to70">Từ 5 - 7 triệu</option>
        <option value="o70">Trên 7 triệu</option>
      </select>
    </div>

    <div id="grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>
  </main>

  <footer class="max-w-7xl mx-auto px-4 mt-16 pt-6 border-t border-slate-200 flex items-center justify-between text-xs text-slate-400">
    <span>© ${siteSettings.brandName} - Cam kết hình thật & giá chính chủ</span>
    <button onclick="window.openPinBox()" class="opacity-40 hover:opacity-100 transition">🔒</button>
  </footer>

  <!-- Hộp thoại mở khóa PIN ẩn dành cho chủ web trên mọi thiết bị -->
  <div id="pinModal" class="hidden fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4">
      <h3 class="font-extrabold text-slate-900 text-base">🔑 Mở Khóa Quyền Chủ Web</h3>
      <input id="pinInput" type="password" placeholder="Nhập mã PIN..." class="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-center font-bold" />
      <p id="pinErr" class="text-xs text-rose-600 hidden">Mã PIN chưa đúng!</p>
      <div class="flex gap-2">
        <button onclick="document.getElementById('pinModal').classList.add('hidden')" class="flex-1 py-2 rounded-xl bg-slate-100 font-bold text-xs">Đóng</button>
        <button onclick="window.checkPin()" class="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs">Mở Khóa</button>
      </div>
    </div>
  </div>

  <script>
    let ROOMS = ${exportedRoomsJson};
    let SETTINGS = ${exportedSettingsJson};
    let IS_ADMIN = false;
    const SYNC_API = ${JSON.stringify(EXTERNAL_SYNC_API)};

    const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Number(n) || 0) + 'đ';

    async function pushCloudSync() {
      try {
        await fetch(SYNC_API, {
          method: 'POST',
          body: JSON.stringify({
            type: 'FULL_SYNC',
            updatedAt: Date.now(),
            rooms: ROOMS,
            settings: SETTINGS
          })
        });
      } catch (e) {
        console.warn('Sync error:', e);
      }
    }

    window.openPinBox = function() {
      document.getElementById('pinInput').value = '';
      document.getElementById('pinErr').classList.add('hidden');
      document.getElementById('pinModal').classList.remove('hidden');
    };

    window.checkPin = function() {
      const val = document.getElementById('pinInput').value.trim();
      if (val === (SETTINGS.adminPin || '123456')) {
        IS_ADMIN = true;
        document.getElementById('pinModal').classList.add('hidden');
        document.getElementById('exitAdminBtn').classList.remove('hidden');
        window.renderRooms();
      } else {
        document.getElementById('pinErr').classList.remove('hidden');
      }
    };

    window.exitAdmin = function() {
      IS_ADMIN = false;
      document.getElementById('exitAdminBtn').classList.add('hidden');
      window.renderRooms();
    };

    window.toggleStatus = async function(id) {
      const room = ROOMS.find(r => r.id === id);
      if (!room) return;
      const order = ['available', 'soon', 'rented'];
      room.status = order[(order.indexOf(room.status) + 1) % order.length];
      room.updatedAt = Date.now();
      window.renderRooms();
      await pushCloudSync();
    };

    window.removeRoom = async function(id) {
      ROOMS = ROOMS.filter(r => r.id !== id);
      window.renderRooms();
      await pushCloudSync();
    };

    function updateDistrictOptions() {
      const distSelect = document.getElementById('dist');
      const currentVal = distSelect.value;
      const dists = [...new Set(ROOMS.map(r => r.district).filter(Boolean))];
      distSelect.innerHTML = '<option value="">📍 Tất cả Quận / Khu vực</option>' +
        dists.map(d => \`<option value="\${d}">\${d}</option>\`).join('');
      distSelect.value = currentVal;
    }

    function updateHeaderUI() {
      document.getElementById('brandName').textContent = SETTINGS.brandName || 'Trọ Xinh';
      document.getElementById('tagline').textContent = SETTINGS.tagline || '';
      const phoneBtn = document.getElementById('phoneBtn');
      phoneBtn.href = 'tel:' + (SETTINGS.salePhone || '');
      phoneBtn.textContent = '📞 ' + (SETTINGS.salePhone || '');
      const zaloClean = (SETTINGS.saleZalo || SETTINGS.salePhone || '').replace(/\\D/g, '');
      document.getElementById('zaloBtn').href = 'https://zalo.me/' + zaloClean;
    }

    window.renderRooms = function() {
      const q = (document.getElementById('q').value || '').toLowerCase().trim();
      const d = document.getElementById('dist').value;
      const t = document.getElementById('type').value;
      const p = document.getElementById('price').value;

      const list = ROOMS.filter(r => {
        if (d && r.district !== d) return false;
        if (t && r.type !== t) return false;
        const price = Number(r.price) || 0;
        if (p === 'u35' && price >= 3500000) return false;
        if (p === '35to50' && (price < 3500000 || price > 5000000)) return false;
        if (p === '50to70' && (price <= 5000000 || price > 7000000)) return false;
        if (p === 'o70' && price <= 7000000) return false;
        if (q && !(r.title + ' ' + r.address + ' ' + r.code + ' ' + r.district).toLowerCase().includes(q)) return false;
        return true;
      }).sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));

      const zaloClean = (SETTINGS.saleZalo || SETTINGS.salePhone || '').replace(/\\D/g, '');

      document.getElementById('grid').innerHTML = list.map(r => \`
        <div class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl transition flex flex-col">
          <div class="relative h-56 bg-slate-200">
            <img src="\${(r.images && r.images[0]) || ''}" class="w-full h-full object-cover" />
            <span class="absolute top-3 left-3 px-2.5 py-1 rounded-xl \${r.status === 'available' ? 'bg-emerald-600 text-white' : r.status === 'soon' ? 'bg-amber-500 text-slate-950' : 'bg-slate-600 text-white'} text-xs font-extrabold">#\${r.code} • \${r.status === 'available' ? 'Còn trống' : r.status === 'soon' ? 'Sắp trống' : 'Đã cho thuê'}</span>
            <span class="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-white/90 text-slate-900 text-xs font-bold">\${r.type || 'Phòng'}</span>
            <span class="absolute bottom-3 left-3 px-3 py-1 rounded-xl bg-slate-900/85 text-white font-extrabold text-sm">\${fmt(r.price)}/tháng • \${r.area}m²</span>
          </div>
          <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
            <div>
              <div class="text-xs font-bold text-emerald-700">📍 \${r.district} • \${r.address}</div>
              <h3 class="font-extrabold text-slate-900 mt-1 text-base">\${r.title}</h3>
              <div class="grid grid-cols-2 gap-2 mt-3 p-3 bg-slate-50 rounded-2xl text-xs border border-slate-100">
                <div>⚡ Điện: <b>\${r.electricPrice ? fmt(r.electricPrice) + '/kWh' : 'Miễn phí'}</b></div>
                <div>💧 Nước: <b>\${r.waterPrice ? fmt(r.waterPrice) + '/' + r.waterUnit : 'Miễn phí'}</b></div>
                <div>🧹 Dịch vụ: <b>\${r.servicePrice ? fmt(r.servicePrice) + '/' + r.serviceUnit : 'Miễn phí'}</b></div>
                <div>🛵 Gửi xe: <b>\${r.parkingPrice ? fmt(r.parkingPrice) + '/xe' : 'Miễn phí'}</b></div>
              </div>
              <p class="text-xs text-slate-600 mt-2 line-clamp-2">\${r.description || ''}</p>
            </div>
            <div class="space-y-2">
              <a href="https://zalo.me/\${zaloClean}" target="_blank" class="block text-center py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition">💬 Nhắn Zalo Xem Phòng #\${r.code}</a>
              \${IS_ADMIN ? \`
                <div class="grid grid-cols-2 gap-2 pt-2 border-t border-dashed border-slate-200">
                  <button onclick="window.toggleStatus('\${r.id}')" class="py-1.5 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">Đổi Trạng Thái</button>
                  <button onclick="window.removeRoom('\${r.id}')" class="py-1.5 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs">Xóa Phòng</button>
                </div>
              \` : ''}
            </div>
          </div>
        </div>
      \`).join('');
    };

    updateDistrictOptions();
    updateHeaderUI();
    window.renderRooms();

    // 1. Tải bản cập nhật mới nhất ngay khi mở trang trên điện thoại
    async function loadLatestFromCloud() {
      try {
        const res = await fetch(SYNC_API + '/json?poll=1&since=48h');
        const text = await res.text();
        const lines = text.trim().split('\\n').filter(Boolean);
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const evt = JSON.parse(lines[i]);
            if (evt.event === 'message' && evt.message) {
              const data = JSON.parse(evt.message);
              if (data && data.type === 'FULL_SYNC') {
                if (Array.isArray(data.rooms)) ROOMS = data.rooms;
                if (data.settings) SETTINGS = { ...SETTINGS, ...data.settings };
                updateDistrictOptions();
                updateHeaderUI();
                window.renderRooms();
                break;
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
    }
    loadLatestFromCloud();

    // 2. Mở kết nối trực tiếp (SSE) để tự nhảy dữ liệu ngay giây phút chủ web bấm Lưu
    try {
      const es = new EventSource(SYNC_API + '/sse');
      es.onmessage = (e) => {
        try {
          const evt = JSON.parse(e.data);
          if (evt.event === 'message' && evt.message) {
            const data = JSON.parse(evt.message);
            if (data && data.type === 'FULL_SYNC') {
              if (Array.isArray(data.rooms)) ROOMS = data.rooms;
              if (data.settings) SETTINGS = { ...SETTINGS, ...data.settings };
              updateDistrictOptions();
              updateHeaderUI();
              window.renderRooms();
            }
          }
        } catch (err) {}
      };
    } catch (e) {}
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Đã tải file index.html có tích hợp tự động đồng bộ Cloud thời gian thực!');
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const total = rooms.length;
    const available = rooms.filter((r) => r.status === 'available').length;
    const soon = rooms.filter((r) => r.status === 'soon').length;
    const rented = rooms.filter((r) => r.status === 'rented').length;
    return { total, available, soon, rented };
  }, [rooms]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* THÔNG BÁO TOAST NỔI */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border bg-slate-900 text-white border-slate-700 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage.msg}</span>
        </div>
      )}

      {/* ==========================================
          THANH ĐIỀU HƯỚNG TRÊN CÙNG (HEADER)
      ========================================== */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Tên Thương Hiệu (Nhấn đúp vào Logo ngôi nhà để mở khóa bí mật cho Sale) */}
          <div className="flex items-center gap-3">
            <div
              onDoubleClick={() => {
                setPinInput('');
                setPinError('');
                setShowPinModal(true);
              }}
              title="Mẹo cho chủ web: Nhấn đúp 2 lần vào logo để mở Quản lý (Sale)"
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 cursor-pointer select-none"
            >
              <Home className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  {siteSettings.brandName}
                </h1>
                <span
                  onClick={isAdmin ? handleForceCloudSync : undefined}
                  title={
                    lastSyncedAt
                      ? `Cập nhật Cloud lúc: ${lastSyncedAt.toLocaleTimeString('vi-VN')}`
                      : 'Đang kết nối Đám mây thời gian thực'
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                    isAdmin ? 'cursor-pointer hover:opacity-80' : ''
                  } ${
                    cloudConnected
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSavingCloud
                        ? 'bg-amber-500 animate-ping'
                        : cloudConnected
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-amber-500'
                    }`}
                  />
                  <Cloud className="w-3 h-3" />
                  <span>
                    {isSavingCloud
                      ? 'Đang đồng bộ Cloud...'
                      : cloudConnected
                      ? 'Cloud Trực Tuyến'
                      : 'Đang kết nối Cloud'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">{siteSettings.tagline}</p>
            </div>
          </div>

          {/* Cụm Nút Liên Hệ Sale & Chế Độ Chủ Web */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={`tel:${siteSettings.salePhone}`}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold transition"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>{siteSettings.salePhone}</span>
            </a>

            <button
              onClick={() => {
                const cleanZalo = (siteSettings.saleZalo || siteSettings.salePhone || '').replace(/\D/g, '');
                window.open(`https://zalo.me/${cleanZalo}`, '_blank', 'noopener,noreferrer');
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Zalo Tư Vấn</span>
            </button>

            {!isAdmin ? (
              <button
                onClick={() => {
                  setPinInput('');
                  setPinError('');
                  setShowPinModal(true);
                }}
                title="Chỉ dành cho chủ web (Sale) nhập mã PIN để cập nhật phòng"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-sm transition"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Quản lý (Sale)</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleForceCloudSync}
                  disabled={isSavingCloud}
                  title="Đẩy toàn bộ dữ liệu hiện tại lên Đám mây ngay lập tức"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 border border-sky-300 text-xs sm:text-sm font-bold transition"
                >
                  <RefreshCw className={`w-4 h-4 text-sky-700 ${isSavingCloud ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">Đồng Bộ Ngay</span>
                </button>
                <button
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 text-xs sm:text-sm font-bold transition"
                >
                  <Share2 className="w-4 h-4 text-emerald-700" />
                  <span className="hidden sm:inline">Gửi Web</span>
                </button>
                <button
                  onClick={openAddRoomModal}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Đăng Phòng</span>
                </button>
                <button
                  onClick={() => {
                    setSettingsForm(siteSettings);
                    setShowSettingsModal(true);
                  }}
                  title="Cài đặt thông tin Web & Sale"
                  className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsAdmin(false);
                    showToast('Đã khóa Chế độ Quản lý (Trở về giao diện Khách hàng).');
                  }}
                  title="Khóa quyền quản trị"
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition"
                >
                  <Unlock className="w-4 h-4" />
                  <span className="hidden lg:inline">Khóa Lại</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* THANH CÔNG CỤ DÀNH RIÊNG CHO CHỦ WEB KHI ĐÃ ĐĂNG NHẬP */}
        {isAdmin && (
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white px-4 py-2.5 border-t border-emerald-700/50">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-300">
                  <Sparkles className="w-4 h-4" /> CHẾ ĐỘ CHỦ WEB ĐANG BẬT:
                </span>
                <span>Tổng: <b>{stats.total}</b> phòng</span>
                <span className="text-emerald-300">• Còn trống: <b>{stats.available}</b></span>
                <span className="text-amber-300">• Sắp trống: <b>{stats.soon}</b></span>
                <span className="text-slate-300">• Đã thuê: <b>{stats.rented}</b></span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-300 hidden md:inline">
                  Bạn có thể bấm trực tiếp vào từng thẻ phòng để Sửa ảnh, Giá tiền hoặc Đổi trạng thái.
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ==========================================
          PHẦN THÂN CHÍNH: BANNER + BỘ LỌC + DANH SÁCH PHÒNG
      ========================================== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* HERO BANNER & THÔNG TIN SALE TRỌ */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 text-white shadow-xl border border-emerald-800/40">
          <div className="relative z-10 p-6 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Giỏ Hàng Chính Chủ • Công Khai Giá Điện Nước • Hỗ Trợ Xem Phòng 24/7</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
                {siteSettings.bannerTitle}
              </h2>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                {siteSettings.bannerSubtitle}
              </p>

              {/* Thống kê nhanh */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="text-xs text-slate-300">Phòng sẵn sàng ở ngay</div>
                  <div className="text-lg font-extrabold text-emerald-400">
                    {stats.available} phòng trống
                  </div>
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="text-xs text-slate-300">Phòng sắp trống</div>
                  <div className="text-lg font-extrabold text-amber-300">
                    {stats.soon} phòng nhận cọc
                  </div>
                </div>
                <div className="px-4 py-2.5 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="text-xs text-slate-300">Khu vực trọng điểm</div>
                  <div className="text-xs sm:text-sm font-bold text-white line-clamp-1 max-w-xs">
                    {siteSettings.saleAreas}
                  </div>
                </div>
              </div>
            </div>

            {/* Thẻ danh thiếp Sale BĐS */}
            <div className="lg:col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 flex flex-col justify-between space-y-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={siteSettings.saleAvatar}
                  alt={siteSettings.saleName}
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/200x200/10b981/ffffff?text=SALE';
                  }}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shrink-0"
                />
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider">
                    Chuyên Viên Tư Vấn
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-0.5">
                    {siteSettings.saleName}
                  </h3>
                  <p className="text-xs text-emerald-200">Hỗ trợ tìm phòng & dẫn đi xem miễn phí</p>
                </div>
              </div>

              <div className="text-xs text-slate-200 space-y-1.5 bg-slate-950/40 p-3 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Hotline / Zalo:</span>
                  <span className="font-bold text-emerald-300">{siteSettings.salePhone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cam kết:</span>
                  <span className="font-semibold text-white">Báo đúng giá - Ảnh thật 100%</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href={`tel:${siteSettings.salePhone}`}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs transition"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Gọi Trực Tiếp</span>
                </a>
                <button
                  onClick={() => {
                    const cleanZalo = (siteSettings.saleZalo || siteSettings.salePhone || '').replace(/\D/g, '');
                    window.open(`https://zalo.me/${cleanZalo}`, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Nhắn Zalo Ngay</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ==========================================
            BỘ LỌC TÌM KIẾM PHÒNG THÔNG MINH CHO KHÁCH
        ========================================== */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-200/90 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                Bộ Lọc Tìm Phòng Nhanh Chóng & Trực Quan
              </h3>
              {activeFilterCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  Đang lọc ({activeFilterCount})
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs sm:text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span>Chỉ hiện phòng còn trống</span>
              </label>

              {activeFilterCount > 0 && (
                <button
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Xóa bộ lọc</span>
                </button>
              )}
            </div>
          </div>

          {/* THANH CHỌN NHANH LOẠI HÌNH BẤT ĐỘNG SẢN BẰNG NÚT TRỰC QUAN */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {['Tất cả', ...ROOM_TYPES].map((typeItem) => {
              const isSelected = selectedType === typeItem;
              return (
                <button
                  key={typeItem}
                  onClick={() => setSelectedType(typeItem)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Home className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{typeItem === 'Tất cả' ? 'Tất cả loại phòng' : typeItem}</span>
                </button>
              );
            })}
          </div>

          {/* Hàng lọc chính */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            {/* Ô tìm kiếm từ khóa */}
            <div className="lg:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên đường, quận, trường ĐH, mã phòng..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Chọn Quận / Khu vực */}
            <div className="lg:col-span-3">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
              >
                {availableDistricts.map((d) => (
                  <option key={d} value={d}>
                    {d === 'Tất cả' ? '📍 Tất cả Quận / Khu vực' : `📍 ${d}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Chọn Khoảng giá */}
            <div className="lg:col-span-2">
              <select
                value={selectedPriceRange}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="all">💰 Mọi mức giá</option>
                <option value="under35">Dưới 3.5 triệu</option>
                <option value="35to50">Từ 3.5 - 5 triệu</option>
                <option value="50to70">Từ 5 - 7 triệu</option>
                <option value="over70">Trên 7 triệu</option>
              </select>
            </div>

            {/* Sắp xếp */}
            <div className="lg:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-700 focus:bg-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="newest">⚡ Mới cập nhật</option>
                <option value="priceAsc">Giá thấp đến cao</option>
                <option value="priceDesc">Giá cao đến thấp</option>
                <option value="areaDesc">Diện tích rộng nhất</option>
              </select>
            </div>
          </div>

          {/* Hàng chọn nhanh Quận phổ biến & mở rộng bộ lọc tiện ích */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {availableDistricts.slice(0, 8).map((dist) => (
                <button
                  key={dist}
                  onClick={() => setSelectedDistrict(dist)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedDistrict === dist
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {dist}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {showAdvancedFilters ? 'Thu gọn lọc tiện ích' : 'Lọc theo diện tích & tiện ích'}
              </span>
            </button>
          </div>

          {/* Khung lọc nâng cao (Diện tích + Tiện ích) */}
          {showAdvancedFilters && (
            <div className="pt-3 border-t border-slate-100 space-y-3 animate-fadeIn">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-600 mr-1">Diện tích tối thiểu:</span>
                {[0, 20, 25, 30, 40].map((area) => (
                  <button
                    key={area}
                    onClick={() => setSelectedMinArea(area)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                      selectedMinArea === area
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {area === 0 ? 'Tất cả' : `Trên ${area}m²`}
                  </button>
                ))}
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-600 block">
                  Chọn tiện ích bắt buộc phải có:
                </span>
                <div className="flex flex-wrap gap-2">
                  {ALL_AMENITIES.map((amenity) => {
                    const active = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        onClick={() => toggleAmenityFilter(amenity)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                          active
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                        <span>{amenity}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ==========================================
            DANH SÁCH THẺ PHÒNG TRỌ / CĂN HỘ
        ========================================== */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Danh Sách Phòng ({filteredRooms.length} phòng phù hợp)
              </h3>
              <p className="text-xs text-slate-500">
                Bấm vào từng phòng để xem toàn bộ ảnh thực tế và bảng tính tổng chi phí hàng tháng
              </p>
            </div>

            {isAdmin && (
              <button
                onClick={openAddRoomModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>+ Thêm Phòng Mới Vào Giỏ Hàng</span>
              </button>
            )}
          </div>

          {filteredRooms.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Home className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-extrabold text-slate-800">
                  Không tìm thấy phòng phù hợp với bộ lọc hiện tại
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Hãy thử xóa bớt tiêu chí lọc hoặc nhắn trực tiếp Zalo cho {siteSettings.saleName}{' '}
                  để nhận danh sách phòng mới vừa trống hôm nay.
                </p>
              </div>
              <button
                onClick={resetAllFilters}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
              >
                Xem Tất Cả Phòng
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room) => {
                const statusBadge =
                  room.status === 'available'
                    ? { label: 'Còn trống', cls: 'bg-emerald-500 text-white' }
                    : room.status === 'soon'
                    ? { label: 'Sắp trống', cls: 'bg-amber-500 text-slate-950' }
                    : { label: 'Đã cho thuê', cls: 'bg-slate-600 text-white' };

                return (
                  <div
                    key={room.id}
                    onClick={() => openRoomDetail(room)}
                    className={`group bg-white rounded-3xl border border-slate-200/90 hover:border-emerald-400 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer ${
                      room.status === 'rented' ? 'opacity-80' : ''
                    }`}
                  >
                    {/* Khung Ảnh Bìa */}
                    <div className="relative h-56 bg-slate-200 overflow-hidden">
                      <img
                        src={
                          room.images && room.images.length > 0
                            ? room.images[0]
                            : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80'
                        }
                        alt={room.title}
                        onError={(e) => {
                          e.target.src =
                            'https://placehold.co/800x500/0f172a/10b981?text=Anh+Phong+Tro';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-slate-950/30" />

                      {/* Nhãn Trạng Thái & Mã Phòng */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-extrabold shadow ${statusBadge.cls}`}
                          >
                            {statusBadge.label}
                          </span>
                          <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 backdrop-blur-sm text-white text-xs font-bold">
                            #{room.code}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-xl bg-white/90 backdrop-blur-sm text-slate-900 text-xs font-bold">
                          {room.type}
                        </span>
                      </div>

                      {/* Giá Thuê & Diện Tích Nổi Bật */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                        <div>
                          <div className="text-[11px] text-emerald-300 font-semibold">
                            Giá thuê niêm yết
                          </div>
                          <div className="text-xl font-extrabold tracking-tight">
                            {formatMillion(room.price)}
                            <span className="text-xs font-normal text-slate-200">/tháng</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1">
                            <Maximize2 className="w-3.5 h-3.5" />
                            {room.area}m²
                          </span>
                          <span className="px-2 py-1 rounded-xl bg-slate-900/70 text-white text-[11px] font-semibold flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {room.images?.length || 1}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Nội Dung Thẻ Phòng */}
                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="line-clamp-1">
                            {room.district} • {room.address}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base line-clamp-2 group-hover:text-emerald-700 transition">
                          {room.title}
                        </h4>

                        {/* BẢNG MINH BẠCH CHI PHÍ ĐIỆN - NƯỚC - DỊCH VỤ - XE */}
                        <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span className="text-slate-500">Điện:</span>
                            <span className="font-bold text-slate-800 truncate">
                              {room.electricPrice === 0
                                ? 'Miễn phí'
                                : `${formatCurrency(room.electricPrice)}/kWh`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                            <span className="text-slate-500">Nước:</span>
                            <span className="font-bold text-slate-800 truncate">
                              {room.waterPrice === 0
                                ? 'Miễn phí'
                                : `${formatCurrency(room.waterPrice)}/${room.waterUnit}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                            <span className="text-slate-500">D.Vụ:</span>
                            <span className="font-bold text-slate-800 truncate">
                              {room.servicePrice === 0
                                ? 'Miễn phí'
                                : `${formatCurrency(room.servicePrice)}/${room.serviceUnit}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Bike className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="text-slate-500">Xe:</span>
                            <span className="font-bold text-slate-800 truncate">
                              {room.parkingPrice === 0
                                ? 'Miễn phí'
                                : `${formatCurrency(room.parkingPrice)}/xe`}
                            </span>
                          </div>
                        </div>

                        {/* Tiện ích nổi bật */}
                        <div className="flex flex-wrap gap-1.5">
                          {(room.amenities || []).slice(0, 4).map((am) => (
                            <span
                              key={am}
                              className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 text-[11px] font-medium"
                            >
                              {am}
                            </span>
                          ))}
                          {(room.amenities || []).length > 4 && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-medium">
                              +{room.amenities.length - 4} tiện ích
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cụm nút hành động cho Khách & cho Admin */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openRoomDetail(room);
                            }}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                            <span>Chi Tiết & Tính Tổng Tiền</span>
                          </button>
                          <button
                            onClick={(e) => handleCopyRoomSummary(room, e)}
                            title="Sao chép thông tin phòng"
                            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Thanh điều khiển nhanh chỉ hiện khi bạn mở khóa Quản lý (Sale) */}
                        {isAdmin && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="grid grid-cols-4 gap-1.5 pt-2 border-t border-dashed border-emerald-200"
                          >
                            <button
                              onClick={(e) => handleQuickCycleStatus(room, e)}
                              className="py-1.5 px-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold flex items-center justify-center gap-1"
                              title="Đổi nhanh trạng thái Còn trống / Sắp trống / Đã thuê"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Trạng thái</span>
                            </button>
                            <button
                              onClick={(e) => handleDuplicateRoom(room, e)}
                              className="py-1.5 px-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-bold flex items-center justify-center gap-1"
                              title="Nhân bản nhanh phòng cùng tòa nhà"
                            >
                              <Files className="w-3 h-3" />
                              <span>Nhân bản</span>
                            </button>
                            <button
                              onClick={(e) => openEditRoomModal(room, e)}
                              className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Sửa</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRoomToDelete(room);
                              }}
                              className="py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center justify-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* ==========================================
          MODAL XEM CHI TIẾT PHÒNG & BẢNG TÍNH DỰ TOÁN CHI PHÍ
      ========================================== */}
      {activeRoom && costBreakdown && (
        <div
          onClick={() => setActiveRoom(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
          >
            {/* Header Modal Chi Tiết */}
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2.5 py-1 rounded-xl bg-slate-900 text-white text-xs font-extrabold shrink-0">
                  #{activeRoom.code}
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate">
                  {activeRoom.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isAdmin && (
                  <button
                    onClick={() => {
                      const r = activeRoom;
                      setActiveRoom(null);
                      openEditRoomModal(r);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Sửa phòng này</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveRoom(null)}
                  className="p-2 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Nội dung cuộn */}
            <div className="p-5 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Cột Trái: Hình ảnh & Mô tả chi tiết */}
              <div className="lg:col-span-7 space-y-4">
                <div className="relative h-64 sm:h-80 rounded-2xl bg-slate-900 overflow-hidden">
                  <img
                    src={
                      activeRoom.images && activeRoom.images.length > 0
                        ? activeRoom.images[activeImageIndex] || activeRoom.images[0]
                        : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1000&q=80'
                    }
                    alt={activeRoom.title}
                    className="w-full h-full object-cover"
                  />
                  {activeRoom.images && activeRoom.images.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActiveImageIndex(
                            (prev) =>
                              (prev - 1 + activeRoom.images.length) % activeRoom.images.length
                          )
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          setActiveImageIndex((prev) => (prev + 1) % activeRoom.images.length)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Danh sách ảnh nhỏ */}
                {activeRoom.images && activeRoom.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {activeRoom.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-20 h-14 rounded-xl overflow-hidden border-2 shrink-0 ${
                          activeImageIndex === idx ? 'border-emerald-600' : 'border-transparent opacity-60'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Thông tin cơ bản */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {activeRoom.address}, {activeRoom.district}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 text-slate-800 text-xs font-bold">
                      {activeRoom.deposit || 'Cọc 1 tháng'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {activeRoom.description}
                  </p>
                </div>

                {/* Toàn bộ tiện ích */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                    Tiện ích & Nội thất có sẵn
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(activeRoom.amenities || []).map((am) => (
                      <span
                        key={am}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cột Phải: BẢNG TỰ TÍNH TỔNG CHI PHÍ HÀNG THÁNG */}
              <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-5 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-sm sm:text-base font-extrabold">
                        Bảng Dự Toán Tổng Chi Phí / Tháng
                      </h4>
                    </div>
                    <span className="text-xs text-emerald-400 font-bold">{activeRoom.area}m²</span>
                  </div>

                  {/* Các thanh điều chỉnh số người, số xe, số điện */}
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Số người ở dự kiến:</span>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            onClick={() => setCalcPeople(num)}
                            className={`w-7 h-7 rounded-lg font-bold ${
                              calcPeople === num
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Số xe máy gửi:</span>
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2, 3].map((num) => (
                          <button
                            key={num}
                            onClick={() => setCalcBikes(num)}
                            className={`w-7 h-7 rounded-lg font-bold ${
                              calcBikes === num
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Ước tính số điện sử dụng:</span>
                        <span className="font-bold text-emerald-400">{calcKwh} kWh/tháng</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="350"
                        step="10"
                        value={calcKwh}
                        onChange={(e) => setCalcKwh(Number(e.target.value))}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Chi tiết từng khoản tiền */}
                  <div className="bg-slate-950/60 rounded-2xl p-4 space-y-2.5 text-xs border border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">1. Tiền thuê phòng cố định:</span>
                      <span className="font-bold">{formatCurrency(costBreakdown.baseRent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        2. Tiền điện ({formatCurrency(activeRoom.electricPrice)} x {calcKwh} kWh):
                      </span>
                      <span className="font-bold">{formatCurrency(costBreakdown.elecTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        3. Tiền nước ({formatCurrency(activeRoom.waterPrice)}/{activeRoom.waterUnit}):
                      </span>
                      <span className="font-bold">{formatCurrency(costBreakdown.waterTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">
                        4. Phí dịch vụ ({formatCurrency(activeRoom.servicePrice)}/{activeRoom.serviceUnit}):
                      </span>
                      <span className="font-bold">{formatCurrency(costBreakdown.serviceTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">5. Phí gửi xe ({calcBikes} xe):</span>
                      <span className="font-bold">{formatCurrency(costBreakdown.parkingTotal)}</span>
                    </div>

                    <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-sm">
                      <span className="font-extrabold text-emerald-300">TỔNG DỰ KIẾN / THÁNG:</span>
                      <span className="text-lg font-extrabold text-emerald-400">
                        {formatCurrency(costBreakdown.totalMonthly)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Chia trung bình ({calcPeople} người):</span>
                      <span className="font-bold text-white">
                        ~ {formatCurrency(costBreakdown.perPerson)} / người
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nút Đặt lịch xem phòng */}
                <div className="space-y-2">
                  <button
                    onClick={() => handleZaloInquiry(activeRoom)}
                    className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Nhắn Zalo Hỏi Phòng #{activeRoom.code} Ngay</span>
                  </button>
                  <a
                    href={`tel:${siteSettings.salePhone}`}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      Gọi {siteSettings.saleName}: {siteSettings.salePhone}
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL NHẬP MÃ PIN MỞ KHÓA QUẢN LÝ (SALE)
      ========================================== */}
      {showPinModal && (
        <div
          onClick={() => setShowPinModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleVerifyPin}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Mở Khóa Chế Độ Chủ Web
                  </h3>
                  <p className="text-xs text-slate-500">Chỉ dành cho Sale cập nhật phòng & giá</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Nhập mã PIN Quản trị (Mặc định: 123456)
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Nhập mã PIN..."
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-center text-lg font-extrabold tracking-widest focus:border-emerald-500 focus:outline-none"
              />
              {pinError && <p className="text-xs text-rose-600 font-semibold">{pinError}</p>}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPinInput(siteSettings.adminPin || '123456')}
                className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Điền nhanh PIN
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-md"
              >
                Mở Khóa Quản Lý
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          MODAL ĐĂNG PHÒNG MỚI / CHỈNH SỬA PHÒNG (ADMIN)
      ========================================== */}
      {showRoomFormModal && roomForm && (
        <div
          onClick={() => setShowRoomFormModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveRoom}
            className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                {editingRoom ? `Chỉnh Sửa Phòng #${roomForm.code}` : 'Đăng Phòng Trọ / Căn Hộ Mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowRoomFormModal(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Thông tin cơ bản */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Mã phòng</label>
                <input
                  type="text"
                  value={roomForm.code}
                  onChange={(e) => setRoomForm({ ...roomForm, code: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Loại hình</label>
                <select
                  value={roomForm.type}
                  onChange={(e) => setRoomForm({ ...roomForm, type: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                >
                  {ROOM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Trạng thái phòng</label>
                <select
                  value={roomForm.status}
                  onChange={(e) => setRoomForm({ ...roomForm, status: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                >
                  <option value="available">🟢 Còn trống</option>
                  <option value="soon">🟡 Sắp trống</option>
                  <option value="rented">⚪ Đã cho thuê</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs font-bold text-slate-700">Tiêu đề thu hút khách</label>
                <input
                  type="text"
                  value={roomForm.title}
                  onChange={(e) => setRoomForm({ ...roomForm, title: e.target.value })}
                  placeholder="VD: Studio Ban Công Thoáng Gần ĐH Hutech..."
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Quận / Khu vực</label>
                <input
                  type="text"
                  value={roomForm.district}
                  onChange={(e) => setRoomForm({ ...roomForm, district: e.target.value })}
                  placeholder="VD: Bình Thạnh"
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Địa chỉ hiển thị</label>
              <input
                type="text"
                value={roomForm.address}
                onChange={(e) => setRoomForm({ ...roomForm, address: e.target.value })}
                placeholder="VD: Đường D2, Phường 25, Quận Bình Thạnh"
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            {/* Giá phòng, diện tích & chi phí điện nước */}
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-emerald-900">
                Bảng Giá Phòng & Chi Phí Điện Nước Minh Bạch
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Giá thuê (đ/tháng)</label>
                  <input
                    type="number"
                    value={roomForm.price}
                    onChange={(e) => setRoomForm({ ...roomForm, price: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Diện tích (m²)</label>
                  <input
                    type="number"
                    value={roomForm.area}
                    onChange={(e) => setRoomForm({ ...roomForm, area: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Tiền điện (đ/kWh)</label>
                  <input
                    type="number"
                    value={roomForm.electricPrice}
                    onChange={(e) => setRoomForm({ ...roomForm, electricPrice: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Tiền gửi xe (đ/xe)</label>
                  <input
                    type="number"
                    value={roomForm.parkingPrice}
                    onChange={(e) => setRoomForm({ ...roomForm, parkingPrice: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Tiền nước (đ)</label>
                  <input
                    type="number"
                    value={roomForm.waterPrice}
                    onChange={(e) => setRoomForm({ ...roomForm, waterPrice: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Đơn vị tính nước</label>
                  <select
                    value={roomForm.waterUnit}
                    onChange={(e) => setRoomForm({ ...roomForm, waterUnit: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  >
                    <option value="người">/ người</option>
                    <option value="khối">/ khối (m³)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Phí dịch vụ (đ)</label>
                  <input
                    type="number"
                    value={roomForm.servicePrice}
                    onChange={(e) => setRoomForm({ ...roomForm, servicePrice: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700">Tiền cọc</label>
                  <input
                    type="text"
                    value={roomForm.deposit}
                    onChange={(e) => setRoomForm({ ...roomForm, deposit: e.target.value })}
                    placeholder="Cọc 1 tháng"
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Tải ảnh phòng từ máy hoặc thêm link */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-700">
                  Hình ảnh thực tế ({roomForm.images?.length || 0} ảnh)
                </label>
                <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingImage ? 'Đang nén ảnh...' : 'Tải ảnh từ Điện thoại / Máy tính'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Hoặc dán link ảnh (URL) vào đây..."
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold"
                >
                  Thêm Link
                </button>
              </div>

              {roomForm.images && roomForm.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-2">
                  {roomForm.images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group h-20 rounded-xl overflow-hidden border border-slate-200"
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      {idx === 0 ? (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">
                          Ảnh bìa
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetCoverImage(idx)}
                          className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[10px]"
                        >
                          Đặt làm bìa
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setRoomForm((prev) => ({
                            ...prev,
                            images: prev.images.filter((_, i) => i !== idx)
                          }))
                        }
                        className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Chọn Tiện ích */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Tích chọn tiện ích của phòng
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_AMENITIES.map((am) => {
                  const checked = (roomForm.amenities || []).includes(am);
                  return (
                    <button
                      type="button"
                      key={am}
                      onClick={() =>
                        setRoomForm((prev) => ({
                          ...prev,
                          amenities: checked
                            ? prev.amenities.filter((x) => x !== am)
                            : [...(prev.amenities || []), am]
                        }))
                      }
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                        checked
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {am}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mô tả chi tiết */}
            <div>
              <label className="text-xs font-bold text-slate-700">Mô tả chi tiết phòng</label>
              <textarea
                rows={3}
                value={roomForm.description}
                onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                placeholder="Mô tả nội thất, vị trí gần trường nào, ưu điểm của phòng..."
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowRoomFormModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-md"
              >
                {editingRoom ? 'Lưu Cập Nhật Phòng' : 'Đăng Phòng Ngay'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          MODAL CÀI ĐẶT THƯƠNG HIỆU WEB & THÔNG TIN SALE
      ========================================== */}
      {showSettingsModal && (
        <div
          onClick={() => setShowSettingsModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveSiteSettings}
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">
                Cài Đặt Thương Hiệu Web & Thông Tin Sale
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Tên trang web / Thương hiệu</label>
                <input
                  type="text"
                  value={settingsForm.brandName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, brandName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Tên của bạn (Sale)</label>
                <input
                  type="text"
                  value={settingsForm.saleName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, saleName: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Số điện thoại Gọi</label>
                <input
                  type="text"
                  value={settingsForm.salePhone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, salePhone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700">Số Zalo nhận tin nhắn</label>
                <input
                  type="text"
                  value={settingsForm.saleZalo}
                  onChange={(e) => setSettingsForm({ ...settingsForm, saleZalo: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">
                Danh sách Quận hiển thị trên bộ lọc (cách nhau bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={settingsForm.customDistricts}
                onChange={(e) =>
                  setSettingsForm({ ...settingsForm, customDistricts: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-xs font-bold text-slate-700">Đổi Mã PIN Quản lý</label>
                <input
                  type="text"
                  value={settingsForm.adminPin}
                  onChange={(e) => setSettingsForm({ ...settingsForm, adminPin: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold"
                />
              </div>
              <div className="pt-4">
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Đổi ảnh đại diện Sale</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Công cụ dọn dẹp hoặc khôi phục phòng mẫu */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-600">
                Quản lý dữ liệu 6 phòng mẫu ban đầu:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleClearSampleRooms}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold"
                >
                  Xóa 6 phòng mẫu
                </button>
                <button
                  type="button"
                  onClick={handleRestoreSampleRooms}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold"
                >
                  Khôi phục phòng mẫu
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Đóng
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-md"
              >
                Lưu Cài Đặt
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==========================================
          MODAL GỬI WEB CHO KHÁCH & TẠO LINK 1 CHẠM
      ========================================== */}
      {showShareModal && (
        <div
          onClick={() => setShowShareModal(false)}
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Gửi Giỏ Hàng & Web Cho Khách (Không Cần Biết Code)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tôi đã đóng gói sẵn mọi thứ, bạn chỉ cần bấm 1 nút bên dưới
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* CÁCH 1: SIÊU TỐC */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white text-xs font-extrabold">
                  CÁCH 1 (3 GIÂY)
                </span>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Copy Bài Đăng Giỏ Hàng Gửi Zalo / Facebook Ngay
                </h4>
              </div>
              <p className="text-xs text-slate-600">
                Hệ thống tự động soạn sẵn danh sách <b>{stats.available + stats.soon} phòng đang trống</b> kèm giá điện, nước, SĐT của bạn. Kết hợp bấm nút <b>Share (Chia sẻ)</b> ở góc trên cùng bên phải màn hình này để lấy link gửi cho khách.
              </p>
              <input
                type="text"
                value={customShareUrl}
                onChange={(e) => setCustomShareUrl(e.target.value)}
                placeholder="Dán link Share của bạn vào đây (không bắt buộc)..."
                className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-300 text-xs"
              />
              <button
                onClick={() => {
                  copyTextToClipboard(generateCatalogPost());
                  showToast('Đã copy bài đăng tổng hợp giỏ hàng! Bạn chỉ cần Dán (Paste) vào Zalo/Facebook.');
                }}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition"
              >
                <Copy className="w-4 h-4" />
                <span>Bấm Để Copy Bài Đăng Giỏ Hàng Ngay</span>
              </button>
            </div>

            {/* CÁCH 2: KÉO THẢ 1 FILE LÊN MẠNG */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-white text-xs font-extrabold">
                  CÁCH 2 (15 GIÂY)
                </span>
                <h4 className="text-sm font-extrabold text-slate-900">
                  Tạo Tên Miền Riêng Bằng Kéo - Thả (Không Cần GitHub/Code)
                </h4>
              </div>
              <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                <li>
                  Bấm nút <b>"Tải File Web Độc Lập (index.html)"</b> bên dưới (tôi đã đóng gói toàn bộ phòng và SĐT của bạn vào đúng 1 file này).
                </li>
                <li>
                  Mở trang <b>app.netlify.com/drop</b> hoặc <b>tiiny.host</b> rồi kéo file <code>index.html</code> vừa tải thả vào ô trên màn hình là có ngay link web riêng!
                </li>
              </ol>
              <button
                onClick={handleDownloadStandaloneHtml}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition"
              >
                <Upload className="w-4 h-4 rotate-180" />
                <span>Tải File Web Độc Lập (index.html) Đã Đóng Gói Sẵn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL XÁC NHẬN XÓA PHÒNG
      ========================================== */}
      {roomToDelete && (
        <div
          onClick={() => setRoomToDelete(null)}
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Xác nhận xóa phòng #{roomToDelete.code}?
              </h3>
              <p className="text-xs text-slate-500 mt-1">{roomToDelete.title}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRoomToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Giữ lại
              </button>
              <button
                onClick={confirmDeleteRoom}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 pt-8 border-t border-slate-200 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          <span className="font-bold text-slate-800">{siteSettings.brandName}</span> — Chuyên trang
          cập nhật Phòng Trọ, Studio, Căn Hộ Dịch Vụ minh bạch chi phí.
        </div>
        <div className="flex items-center gap-4">
          <span>Sale phụ trách: <b>{siteSettings.saleName}</b></span>
          <span>•</span>
          <span>Hotline/Zalo: <b>{siteSettings.salePhone}</b></span>
          {!isAdmin && (
            <button
              onClick={() => {
                setPinInput('');
                setPinError('');
                setShowPinModal(true);
              }}
              title="Lối vào ẩn dành cho Chủ Web"
              className="opacity-30 hover:opacity-100 text-slate-400 hover:text-slate-700 transition p-1"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}