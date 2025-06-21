import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { LocalStorage } from "@/lib/storage";
import { recordsToCSV, downloadCSV, generateCSVFileName, getMonthName } from "@/lib/csv";
import { ProcessRecord, InsertProcessRecord, AdminSettings } from "@shared/schema";
import { Edit, BarChart3, Archive, Settings, LogOut, Trash2, Eye, EyeOff, Plus, Download, Upload, ArrowLeft, Send } from "lucide-react";

type Screen = 'record' | 'summary' | 'archive' | 'admin-login' | 'admin-panel' | 'data-management';
type DataType = 'productCodes' | 'operationTypes' | 'operationMeasures';

export default function ProcessTracker() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('record');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(LocalStorage.getAdminSettings());
  const [records, setRecords] = useState<ProcessRecord[]>([]);
  const [recentNames, setRecentNames] = useState<string[]>([]);
  const [currentDataType, setCurrentDataType] = useState<DataType>('productCodes');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmMessage, setConfirmMessage] = useState('');
  const [newItemInput, setNewItemInput] = useState('');
  const [editingItem, setEditingItem] = useState<{ index: number; value: string } | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState<InsertProcessRecord>({
    date: new Date().toISOString().split('T')[0],
    name: '',
    productCode: '',
    operationType: '',
    operationMeasure: '',
    quantity: 1,
    description: ''
  });

  const [adminLoginData, setAdminLoginData] = useState({
    password: ''
  });

  useEffect(() => {
    setRecords(LocalStorage.getRecords());
    setRecentNames(LocalStorage.getRecentNames());
    setIsAdminLoggedIn(LocalStorage.getAdminLoginStatus());
    
    // Check if intro was already shown or disable intro for now
    setShowIntro(false);
  }, []);

  const handleRecordSubmit = () => {
    if (!formData.name || !formData.productCode || !formData.operationType || !formData.operationMeasure || !formData.quantity) {
      toast({
        title: "Hata",
        description: "Lütfen tüm zorunlu alanları doldurun!",
        variant: "destructive"
      });
      return;
    }

    const newRecord: ProcessRecord = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    };

    LocalStorage.saveRecord(newRecord);
    LocalStorage.addRecentName(formData.name);
    
    setRecords(prev => [...prev, newRecord]);
    setRecentNames(LocalStorage.getRecentNames());
    
    setFormData({
      date: new Date().toISOString().split('T')[0],
      name: '',
      productCode: '',
      operationType: '',
      operationMeasure: '',
      quantity: 1,
      description: ''
    });

    toast({
      title: "Başarılı",
      description: "İşlem başarıyla kaydedildi!"
    });
  };

  const handleAdminLogin = () => {
    if (adminLoginData.password === adminSettings.password) {
      setIsAdminLoggedIn(true);
      LocalStorage.setAdminLoginStatus(true);
      setCurrentScreen('admin-panel');
      toast({
        title: "Başarılı",
        description: "Giriş başarılı!"
      });
    } else {
      toast({
        title: "Hata",
        description: "Hatalı şifre!",
        variant: "destructive"
      });
    }
  };

  const getCurrentMonthRecords = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    return records.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate.getMonth() + 1 === currentMonth && recordDate.getFullYear() === currentYear;
    });
  };

  const deleteRecord = (id: string) => {
    setConfirmMessage('Bu kaydı silmek istediğinize emin misiniz?');
    setConfirmAction(() => () => {
      LocalStorage.deleteRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      toast({
        title: "Başarılı",
        description: "Kayıt silindi!"
      });
    });
    setShowConfirmDialog(true);
  };

  const sendWhatsApp = () => {
    const monthRecords = getCurrentMonthRecords();
    if (monthRecords.length === 0) {
      toast({
        title: "Uyarı",
        description: "Bu ay hiç kayıt bulunmuyor!",
        variant: "destructive"
      });
      return;
    }

    const csvContent = recordsToCSV(monthRecords);
    const currentDate = new Date();
    const monthName = getMonthName(currentDate.getMonth() + 1);
    const year = currentDate.getFullYear();
    
    const message = `${monthName} ${year} Aylık Rapor:\n\n${csvContent}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const sendCSVToWhatsApp = (fileName: string) => {
    // Extract person and date info from filename
    const parts = fileName.split(' - ');
    if (parts.length >= 2) {
      const personName = parts[0];
      const dateStr = parts[1].replace('.csv', '');
      
      // Find records matching this person and month/year
      const fileRecords = records.filter(record => {
        const recordDate = new Date(record.date);
        const recordMonthYear = `${getMonthName(recordDate.getMonth() + 1)} ${recordDate.getFullYear()}`;
        return record.name === personName && recordMonthYear === dateStr;
      });
      
      if (fileRecords.length === 0) {
        toast({
          title: "Uyarı",
          description: "Bu dosyada kayıt bulunmuyor!",
          variant: "destructive"
        });
        return;
      }

      const csvContent = recordsToCSV(fileRecords);
      const message = `${fileName} Raporu:\n\n${csvContent}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const getCSVFilesByYear = () => {
    const filesByYear: { [year: string]: Array<{ name: string; month: string; recordCount: number }> } = {};
    
    records.forEach(record => {
      const date = new Date(record.date);
      const year = date.getFullYear().toString();
      const month = getMonthName(date.getMonth() + 1);
      const key = `${record.name} - ${month} ${year}`;
      
      if (!filesByYear[year]) {
        filesByYear[year] = [];
      }
      
      const existing = filesByYear[year].find(f => f.name === key);
      if (existing) {
        existing.recordCount++;
      } else {
        filesByYear[year].push({ name: key, month, recordCount: 1 });
      }
    });
    
    return filesByYear;
  };

  const deleteCSVFile = (fileName: string) => {
    setConfirmMessage('Bu CSV dosyasını silmek istediğinize emin misiniz?');
    setConfirmAction(() => () => {
      // Extract person and date info from filename
      const parts = fileName.split(' - ');
      if (parts.length >= 2) {
        const personName = parts[0];
        const dateStr = parts[1].replace('.csv', '');
        
        // Find and delete records matching this person and month/year
        const updatedRecords = records.filter(record => {
          const recordDate = new Date(record.date);
          const recordMonthYear = `${getMonthName(recordDate.getMonth() + 1)} ${recordDate.getFullYear()}`;
          return !(record.name === personName && recordMonthYear === dateStr);
        });
        
        setRecords(updatedRecords);
        localStorage.setItem('processRecords', JSON.stringify(updatedRecords));
      }
      
      toast({
        title: "Başarılı",
        description: "CSV dosyası silindi!"
      });
    });
    setShowConfirmDialog(true);
  };

  const deleteAllCSV = () => {
    setConfirmMessage('Tüm CSV dosyalarını silmek istediğinize emin misiniz? Bu işlem geri alınamaz!');
    setConfirmAction(() => () => {
      LocalStorage.clearAll();
      setRecords([]);
      setRecentNames([]);
      toast({
        title: "Başarılı",
        description: "Tüm CSV dosyaları silindi!"
      });
    });
    setShowConfirmDialog(true);
  };

  const handleDataManagement = (dataType: DataType) => {
    setCurrentDataType(dataType);
    setCurrentScreen('data-management');
  };

  const getCurrentDataItems = () => {
    return adminSettings[currentDataType] || [];
  };

  const addNewItem = () => {
    if (!newItemInput.trim()) return;
    
    const currentItems = getCurrentDataItems();
    if (currentItems.includes(newItemInput.trim())) {
      toast({
        title: "Uyarı",
        description: "Bu öğe zaten mevcut!",
        variant: "destructive"
      });
      return;
    }

    const updatedSettings = {
      ...adminSettings,
      [currentDataType]: [...currentItems, newItemInput.trim()]
    };
    
    setAdminSettings(updatedSettings);
    LocalStorage.saveAdminSettings(updatedSettings);
    setNewItemInput('');
    
    toast({
      title: "Başarılı",
      description: "Yeni öğe eklendi!"
    });
  };

  const deleteItem = (index: number) => {
    const currentItems = getCurrentDataItems();
    const updatedItems = currentItems.filter((_, i) => i !== index);
    
    const updatedSettings = {
      ...adminSettings,
      [currentDataType]: updatedItems
    };
    
    setAdminSettings(updatedSettings);
    LocalStorage.saveAdminSettings(updatedSettings);
    
    toast({
      title: "Başarılı",
      description: "Öğe silindi!"
    });
  };

  const saveEditedItem = () => {
    if (!editingItem || !editingItem.value.trim()) return;
    
    const currentItems = getCurrentDataItems();
    const updatedItems = [...currentItems];
    updatedItems[editingItem.index] = editingItem.value.trim();
    
    const updatedSettings = {
      ...adminSettings,
      [currentDataType]: updatedItems
    };
    
    setAdminSettings(updatedSettings);
    LocalStorage.saveAdminSettings(updatedSettings);
    setEditingItem(null);
    
    toast({
      title: "Başarılı",
      description: "Öğe güncellendi!"
    });
  };

  const exportData = () => {
    const items = getCurrentDataItems();
    const csvContent = items.join('\n');
    const fileName = `${currentDataType}.csv`;
    downloadCSV(csvContent, fileName);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const items = content.split('\n').map(line => line.trim()).filter(line => line);
      
      const uniqueItems = Array.from(new Set([...getCurrentDataItems(), ...items]));
      const updatedSettings = {
        ...adminSettings,
        [currentDataType]: uniqueItems
      };
      
      setAdminSettings(updatedSettings);
      LocalStorage.saveAdminSettings(updatedSettings);
      
      toast({
        title: "Başarılı",
        description: "Veriler içe aktarıldı!"
      });
    };
    reader.readAsText(file);
  };

  const renderStatusBar = () => (
    <div className="status-bar">
      <span>14:02</span>
      <div className="flex items-center space-x-1 text-xs">
        <span>📶</span>
        <span>📶</span>
        <span>🔋</span>
        <span>90</span>
      </div>
    </div>
  );

  const renderTopBar = () => (
    <div className="top-bar">
      <h1 className="text-lg font-medium">İşlem Takibi</h1>
      {adminSettings.companyName && (
        <p className="text-sm opacity-80">{adminSettings.companyName}</p>
      )}
    </div>
  );

  const renderBottomNav = () => (
    <div className="bottom-nav">
      <div className="flex justify-around items-center">
        <button 
          className={`nav-item ${currentScreen === 'record' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('record')}
        >
          <Edit className="w-5 h-5" />
          <span className="text-xs mt-1">Kayıt</span>
        </button>
        <button 
          className={`nav-item ${currentScreen === 'summary' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('summary')}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-xs mt-1">Özet</span>
        </button>
        <button 
          className={`nav-item ${currentScreen === 'archive' ? 'active' : ''}`}
          onClick={() => setCurrentScreen('archive')}
        >
          <Archive className="w-5 h-5" />
          <span className="text-xs mt-1">Arşiv</span>
        </button>
        <button 
          className={`nav-item ${currentScreen === 'admin-login' || currentScreen === 'admin-panel' ? 'active' : ''}`}
          onClick={() => setCurrentScreen(isAdminLoggedIn ? 'admin-panel' : 'admin-login')}
        >
          <Settings className="w-5 h-5" />
          <span className="text-xs mt-1">Ayarlar</span>
        </button>
        <button 
          className="nav-item"
          onClick={() => {
            setConfirmMessage('Uygulamadan çıkmak istediğinize emin misiniz?');
            setConfirmAction(() => () => window.close());
            setShowConfirmDialog(true);
          }}
        >
          <LogOut className="w-5 h-5" />
          <span className="text-xs mt-1">Çıkış</span>
        </button>
      </div>
    </div>
  );

  const renderRecordScreen = () => (
    <div className="p-4 pb-20">
      <Card className="form-section">
        <CardHeader>
          <CardTitle className="text-base">İşlem Kaydı</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="date">Tarih</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="name">Ad Soyad</Label>
            <Input
              id="name"
              placeholder="Ad Soyad"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              list="name-suggestions"
              className="mt-1"
            />
            <datalist id="name-suggestions">
              {recentNames.map((name, index) => (
                <option key={index} value={name} />
              ))}
            </datalist>
          </div>

          <div>
            <Label htmlFor="product-code">Ürün Kodu</Label>
            <Select value={formData.productCode} onValueChange={(value) => setFormData(prev => ({ ...prev, productCode: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Ürün Kodu Seçin" />
              </SelectTrigger>
              <SelectContent>
                {adminSettings.productCodes.map((code) => (
                  <SelectItem key={code} value={code}>{code}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="operation-type">İşlem Türü</Label>
            <Select value={formData.operationType} onValueChange={(value) => setFormData(prev => ({ ...prev, operationType: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="İşlem Türü Seçin" />
              </SelectTrigger>
              <SelectContent>
                {adminSettings.operationTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="operation-measure">İşlem Ölçüsü</Label>
            <Select value={formData.operationMeasure} onValueChange={(value) => setFormData(prev => ({ ...prev, operationMeasure: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="İşlem Ölçüsü Seçin" />
              </SelectTrigger>
              <SelectContent>
                {adminSettings.operationMeasures.map((measure) => (
                  <SelectItem key={measure} value={measure}>{measure}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Adet</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="Adet"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Açıklama (İsteğe bağlı)</Label>
            <Textarea
              id="description"
              placeholder="Açıklama"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          <Button onClick={handleRecordSubmit} className="w-full bg-secondary hover:bg-secondary/90">
            Ekle
          </Button>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-500 space-y-2">
        <div>
          <p>Son Kayıt</p>
          <p className="text-xs">Bugün {records.filter(r => r.date === new Date().toISOString().split('T')[0]).length} işlem kaydedildi</p>
        </div>
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500">{adminSettings.companyName || 'Firma İsmi Belirtilmemiş'}</p>
          <p className="text-xs text-gray-400">Developed by İlyas Yeşil</p>
        </div>
      </div>
    </div>
  );

  const renderSummaryScreen = () => {
    const monthRecords = getCurrentMonthRecords();
    const totalQuantity = monthRecords.reduce((sum, record) => sum + record.quantity, 0);
    
    return (
      <div className="p-4 pb-20">
        <Card className="form-section">
          <CardHeader>
            <CardTitle className="text-base">Özet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-lg font-medium text-gray-800">Toplam Adet : {totalQuantity}</p>
            </div>

            <div className="space-y-2 mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">İşlemler :</h3>
              {monthRecords.length === 0 ? (
                <p className="text-sm text-gray-500">Bu ay hiç kayıt bulunmuyor.</p>
              ) : (
                monthRecords.map((record, index) => (
                  <div key={record.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded text-sm">
                    <div>
                      <span className="font-medium">{index + 1}. {record.operationType} {record.operationMeasure}</span>
                      <span className="text-gray-600"> : {record.quantity} Adet</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRecord(record.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            <Button onClick={sendWhatsApp} className="w-full bg-green-600 hover:bg-green-700 text-white">
              <Send className="w-4 h-4 mr-2" />
              WhatsApp'a Gönder
            </Button>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-gray-500 mt-4">
          <p className="text-xs text-gray-500">{adminSettings.companyName || 'Firma İsmi Belirtilmemiş'}</p>
          <p className="text-xs text-gray-400">Developed by İlyas Yeşil</p>
        </div>
      </div>
    );
  };

  const renderArchiveScreen = () => {
    const filesByYear = getCSVFilesByYear();
    
    return (
      <div className="p-4 pb-20">
        <Card className="form-section">
          <CardHeader>
            <CardTitle className="text-base">CSV Arşivi</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(filesByYear).length === 0 ? (
              <p className="text-sm text-gray-500">Henüz hiç CSV dosyası bulunmuyor.</p>
            ) : (
              Object.entries(filesByYear).map(([year, files]) => (
                <div key={year} className="mb-4">
                  <div className="bg-gray-100 rounded-lg p-3 mb-4">
                    <h3 className="font-medium text-gray-800">{year} Yılı</h3>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-gray-700">CSV Dosyaları :</p>
                    {files.map((file, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded text-sm">
                          <span>{index + 1}. {file.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCSVFile(file.name)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button 
                          onClick={() => sendCSVToWhatsApp(file.name)}
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1"
                          size="sm"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          WhatsApp'a Gönder
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            <Button onClick={deleteAllCSV} className="w-full bg-red-600 hover:bg-red-700 text-white">
              Bütün CSV Dosyalarını Sil
            </Button>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-gray-500 mt-4">
          <p className="text-xs text-gray-500">{adminSettings.companyName || 'Firma İsmi Belirtilmemiş'}</p>
          <p className="text-xs text-gray-400">Developed by İlyas Yeşil</p>
        </div>
      </div>
    );
  };

  const renderAdminLoginScreen = () => (
    <div className="p-4 pb-20">
      <Card className="form-section">
        <CardHeader>
          <CardTitle className="text-base text-center">Yönetici Girişi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="admin-password">Şifre</Label>
            <div className="relative mt-1">
              <Input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                placeholder="Şifre"
                value={adminLoginData.password}
                onChange={(e) => setAdminLoginData(prev => ({ ...prev, password: e.target.value }))}
                className="pr-12"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <Button onClick={handleAdminLogin} className="w-full bg-secondary hover:bg-secondary/90">
            Giriş
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderAdminPanelScreen = () => (
    <div className="p-4 pb-20">
      <Card className="form-section">
        <CardHeader>
          <CardTitle className="text-base">Yönetim Paneli</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Firma Ayarları</h3>
            <div className="space-y-3">
              <Input
                placeholder="Firma İsmi"
                value={adminSettings.companyName}
                onChange={(e) => setAdminSettings(prev => ({ ...prev, companyName: e.target.value }))}
              />
              <Button 
                onClick={() => {
                  LocalStorage.saveAdminSettings(adminSettings);
                  toast({ title: "Başarılı", description: "Firma ismi kaydedildi!" });
                }}
                className="w-full bg-secondary hover:bg-secondary/90"
              >
                Firma İsmini Kaydet
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Button onClick={() => handleDataManagement('productCodes')} className="w-full bg-primary hover:bg-primary/90">
              Ürün Kodu
            </Button>
            <Button onClick={() => handleDataManagement('operationTypes')} className="w-full bg-primary hover:bg-primary/90">
              İşlem Türü
            </Button>
            <Button onClick={() => handleDataManagement('operationMeasures')} className="w-full bg-primary hover:bg-primary/90">
              İşlem Ölçüsü
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Şifre Değiştirme</h3>
            <div className="space-y-3">
              <div className="relative">
                <Input type="password" placeholder="Yeni Şifre" />
                <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
              <div className="relative">
                <Input type="password" placeholder="Yeni Şifre Tekrar" />
                <Button variant="ghost" size="sm" className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
              <Button className="w-full bg-secondary hover:bg-secondary/90">
                Şifreyi Değiştir
              </Button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500">{adminSettings.companyName || 'Firma İsmi Belirtilmemiş'}</p>
            <p className="text-xs text-gray-400">Developed by İlyas Yeşil</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const getDataTypeTitle = () => {
    switch (currentDataType) {
      case 'productCodes': return 'Ürün Kodu Yönetimi';
      case 'operationTypes': return 'İşlem Türü Yönetimi';
      case 'operationMeasures': return 'İşlem Ölçüsü Yönetimi';
      default: return 'Veri Yönetimi';
    }
  };

  const renderDataManagementScreen = () => (
    <div className="p-4 pb-20">
      <Card className="form-section">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{getDataTypeTitle()}</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentScreen('admin-panel')}
            className="p-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Yeni öğe ekle"
                value={newItemInput}
                onChange={(e) => setNewItemInput(e.target.value)}
                className="flex-1"
              />
              <Button onClick={addNewItem} className="bg-green-600 hover:bg-green-700 text-white px-4">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            {getCurrentDataItems().map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                {editingItem?.index === index ? (
                  <Input
                    value={editingItem.value}
                    onChange={(e) => setEditingItem({ ...editingItem, value: e.target.value })}
                    onBlur={saveEditedItem}
                    onKeyPress={(e) => e.key === 'Enter' && saveEditedItem()}
                    className="text-sm mr-2"
                    autoFocus
                  />
                ) : (
                  <span className="text-sm">{item}</span>
                )}
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingItem({ index, value: item })}
                    className="text-blue-500 hover:text-blue-700 p-1"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteItem(index)}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="block">
              <input
                type="file"
                accept=".csv"
                onChange={importData}
                className="hidden"
              />
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Upload className="w-4 h-4 mr-2" />
                CSV İçe Aktar
              </Button>
            </label>
            <Button onClick={exportData} className="w-full bg-green-600 hover:bg-green-700 text-white">
              <Download className="w-4 h-4 mr-2" />
              CSV Dışa Aktar
            </Button>
          </div>
          
          <div className="text-center text-sm text-gray-500 mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">{adminSettings.companyName || 'Firma İsmi Belirtilmemiş'}</p>
            <p className="text-xs text-gray-400">Developed by İlyas Yeşil</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderIntroScreen = () => (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-md">
        <video
          className="w-full h-full object-cover"
          autoPlay
          muted
          onEnded={() => {
            setShowIntro(false);
            localStorage.setItem('introVideoShown', 'true');
          }}
          onClick={() => {
            setShowIntro(false);
            localStorage.setItem('introVideoShown', 'true');
          }}
        >
          <source src="/attached_assets/intro_1750486595677.mp4" type="video/mp4" />
          Video desteği bulunmuyor.
        </video>
        <button
          onClick={() => {
            setShowIntro(false);
            localStorage.setItem('introVideoShown', 'true');
          }}
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 text-sm"
        >
          Geç
        </button>
      </div>
    </div>
  );

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'record': return renderRecordScreen();
      case 'summary': return renderSummaryScreen();
      case 'archive': return renderArchiveScreen();
      case 'admin-login': return renderAdminLoginScreen();
      case 'admin-panel': return renderAdminPanelScreen();
      case 'data-management': return renderDataManagementScreen();
      default: return renderRecordScreen();
    }
  };

  return (
    <div className="mobile-container">
      {showIntro && renderIntroScreen()}
      
      {renderStatusBar()}
      {renderTopBar()}
      
      <main className="pb-20">
        {renderCurrentScreen()}
      </main>

      {renderBottomNav()}

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Onay</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAction} className="bg-red-600 hover:bg-red-700">
              Onayla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
