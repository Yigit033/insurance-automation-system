import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await signIn(formData.email, formData.password);
      
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Giriş Hatası",
            description: "E-posta veya şifre hatalı. Lütfen tekrar deneyin.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Giriş Hatası",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Başarılı!",
          description: "Giriş işlemi tamamlandı."
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Bir hata oluştu",
        description: "Giriş işlemi sırasında beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Şifre Hatası",
        description: "Şifreler eşleşmiyor. Lütfen kontrol edin.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Şifre Hatası",
        description: "Şifre en az 6 karakter olmalıdır.",
        variant: "destructive"
      });
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(formData.email, formData.password, formData.fullName);
      
      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: "Kayıt Hatası",
            description: "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Kayıt Hatası",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Kayıt Başarılı!",
          description: "Hesabınız oluşturuldu. Artık giriş yapabilirsiniz."
        });
        // Clear form
        setFormData({
          email: '',
          password: '',
          fullName: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      toast({
        title: "Bir hata oluştu",
        description: "Kayıt işlemi sırasında beklenmeyen bir hata oluştu.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-insurance-light-blue via-background to-insurance-light-gray flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-insurance-navy mb-2">
            Sigorta OCR
          </h1>
          <p className="text-insurance-gray">
            Belge işleme sisteminize hoş geldiniz
          </p>
        </div>

        <Card className="bg-gradient-card shadow-card border-border">
          <CardHeader className="text-center">
            <CardTitle className="text-insurance-navy">Hesabınıza Erişin</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Giriş Yap</TabsTrigger>
                <TabsTrigger value="signup">Kayıt Ol</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-insurance-navy flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      E-posta
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="border-insurance-blue focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-insurance-navy flex items-center">
                      <Lock className="w-4 h-4 mr-2" />
                      Şifre
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="border-insurance-blue focus:border-primary"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary text-primary-foreground hover:bg-primary-hover"
                    disabled={isLoading}
                  >
                    {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-insurance-navy flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Ad Soyad
                    </Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Adınız Soyadınız"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      required
                      className="border-insurance-blue focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-insurance-navy flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      E-posta
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="ornek@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="border-insurance-blue focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-insurance-navy flex items-center">
                      <Lock className="w-4 h-4 mr-2" />
                      Şifre
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="En az 6 karakter"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      className="border-insurance-blue focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-insurance-navy flex items-center">
                      <Lock className="w-4 h-4 mr-2" />
                      Şifre Tekrar
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="Şifrenizi tekrar girin"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      className="border-insurance-blue focus:border-primary"
                    />
                  </div>

                  <div className="flex items-start space-x-2 text-xs text-insurance-gray">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>
                      Kayıt olarak platformun kullanım şartlarını kabul etmiş olursunuz.
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary text-primary-foreground hover:bg-primary-hover"
                    disabled={isLoading}
                  >
                    {isLoading ? "Kayıt yapılıyor..." : "Kayıt Ol"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;