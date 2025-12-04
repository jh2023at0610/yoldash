import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, FileSearch, Zap, Shield, ArrowRight, CheckCircle } from 'lucide-react';

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle size={32} className="text-white" />
            <h1 className="text-2xl font-bold">Yoldaş</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-white hover:bg-white/20 rounded-lg transition-all"
            >
              Daxil ol
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-2 bg-white text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-all"
            >
              Qeydiyyat
            </button>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Yol Hərəkəti Qaydaları<br />Bir Kliklə
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Süni intellekt köməkçiniz yol hərəkəti qaydaları və cərimələr haqqında dəqiq cavablar verir
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-4 bg-white text-blue-700 text-lg font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              Pulsuz Başla
              <ArrowRight size={20} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-white/20 backdrop-blur text-white text-lg font-semibold rounded-xl hover:bg-white/30 transition-all"
            >
              Daxil ol
            </button>
          </div>
          <p className="mt-6 text-blue-200">
            ✨ 20 pulsuz token ilə başlayın
          </p>
        </div>
      </header>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          Niyə Yoldaş?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all">
            <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <MessageCircle className="text-blue-600" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Asan Sual-Cavab</h3>
            <p className="text-gray-600">
              Sadəcə sualınızı yazın və dəqiq cavab alın. Mürəkkəb qaydaları sadə dillə izah edirik.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all">
            <div className="bg-green-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <FileSearch className="text-green-600" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Rəsmi Sənədlər</h3>
            <p className="text-gray-600">
              Cavablar yalnız rəsmi qanunvericilik sənədlərinə əsasən verilir. Dəqiq və etibarlı məlumat.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all">
            <div className="bg-purple-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <Zap className="text-purple-600" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Sürətli Cavab</h3>
            <p className="text-gray-600">
              AI texnologiyası ilə saniyələr ərzində cavab alın. Artıq uzun axtarışlara ehtiyac yoxdur.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all">
            <div className="bg-orange-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
              <Shield className="text-orange-600" size={28} />
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-800">Təhlükəsiz</h3>
            <p className="text-gray-600">
              Məlumatlarınız Firebase ilə qorunur. Etibarlı və təhlükəsiz xidmət.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-gradient-to-br from-gray-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
            Necə İşləyir?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Qeydiyyatdan Keçin</h3>
              <p className="text-gray-600">
                Sadəcə email, telefon və şəxsi məlumatlarınızla qeydiyyatdan keçin. 20 pulsuz token qazanın.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Sualınızı Yazın</h3>
              <p className="text-gray-600">
                Yol hərəkəti qaydaları və cərimələr haqqında istənilən sualı verin. AI sizə kömək edəcək.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Dəqiq Cavab Alın</h3>
              <p className="text-gray-600">
                Rəsmi sənədlərə istinadlarla birlikdə Azərbaycan dilində aydın cavablar alın.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
          Sadə və Şəffaf Qiymət
        </h2>
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-blue-600">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 text-center">
            <h3 className="text-2xl font-bold mb-2">Başlanğıc Paketi</h3>
            <p className="text-blue-100">Yeni istifadəçilər üçün</p>
          </div>
          <div className="p-8">
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-gray-800 mb-2">20</div>
              <div className="text-gray-600">Pulsuz Token</div>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="text-green-500" size={20} />
                <span>1 token = 1 sual</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="text-green-500" size={20} />
                <span>Rəsmi qanunlara əsasən cavablar</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="text-green-500" size={20} />
                <span>24/7 əlçatanlıq</span>
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <CheckCircle className="text-green-500" size={20} />
                <span>Dəqiq istinadlar və maddələr</span>
              </li>
            </ul>
            <button
              onClick={() => navigate('/register')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
            >
              İndi Başla
            </button>
            <p className="text-center text-sm text-gray-500 mt-4">
              Token bitdikdə müştəri xidməti ilə əlaqə saxlayın
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Yol Qaydalarını Öyrənmək İndi Daha Asan
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            İndi qeydiyyatdan keçin və 20 pulsuz token qazanın
          </p>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-4 bg-white text-blue-700 text-lg font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg inline-flex items-center gap-2"
          >
            Pulsuz Başla
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle size={24} className="text-blue-400" />
                <h3 className="text-xl font-bold text-white">Yoldaş</h3>
              </div>
              <p className="text-gray-400">
                Yol hərəkəti qaydaları və cərimələr üzrə süni intellekt köməkçisi
              </p>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Keçidlər</h4>
              <ul className="space-y-2">
                <li>
                  <button onClick={() => navigate('/register')} className="hover:text-blue-400 transition-all">
                    Qeydiyyat
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/login')} className="hover:text-blue-400 transition-all">
                    Daxil ol
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Əlaqə</h4>
              <p className="text-gray-400 mb-2">
                Balans artırımı və dəstək üçün müştəri xidməti ilə əlaqə saxlayın
              </p>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-500">
            <p>&copy; 2025 Yoldaş. Bütün hüquqlar qorunur.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;

