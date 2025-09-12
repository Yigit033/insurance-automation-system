import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AnalyticsData } from '@/hooks/useAnalytics';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

interface AnalyticsChartsProps {
  analytics: AnalyticsData;
}

export function AnalyticsCharts({ analytics }: AnalyticsChartsProps) {
  const typeData = Object.entries(analytics.documents_by_type || {}).map(([type, count]) => ({
    name: type,
    value: count
  }));

  const monthlyData = Object.entries(analytics.monthly_uploads || {}).map(([month, count]) => ({
    month,
    uploads: count
  })).sort((a, b) => a.month.localeCompare(b.month));

  const successRate = analytics.total_documents > 0 
    ? ((analytics.processed_documents / analytics.total_documents) * 100).toFixed(1)
    : '0';

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Belge Türleri Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Aylık Yükleme Trendi</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="uploads" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performans Metrikleri</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {successRate}%
              </div>
              <div className="text-sm text-muted-foreground">Başarı Oranı</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analytics.avg_confidence ? analytics.avg_confidence.toFixed(1) : '0'}%
              </div>
              <div className="text-sm text-muted-foreground">Ortalama Güven</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analytics.avg_processing_time ? (analytics.avg_processing_time / 1000).toFixed(1) : '0'}s
              </div>
              <div className="text-sm text-muted-foreground">Ortalama İşlem</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analytics.failed_documents}
              </div>
              <div className="text-sm text-muted-foreground">Başarısız</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Durum Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Tamamlanan', value: analytics.processed_documents },
              { name: 'Başarısız', value: analytics.failed_documents },
              { name: 'İşlemde', value: analytics.total_documents - analytics.processed_documents - analytics.failed_documents }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}