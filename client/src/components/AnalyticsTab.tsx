import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Card,
  Typography,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Chip
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { TrendingUp, Users, Monitor, Globe } from "lucide-react";

const COLORS = ["#3949AB", "#1E88E5", "#26A69A", "#7CB342", "#FFA726", "#EF5350", "#AB47BC", "#5C6BC0"];

interface AnalyticsStats {
  totalViews: number;
  uniqueVisitors: number;
  viewsByDay: Array<{ date: string; views: number }>;
  viewsByCountry: Array<{ country: string; views: number }>;
  viewsByDevice: Array<{ device: string; views: number }>;
  viewsByOS: Array<{ os: string; views: number }>;
  viewsByBrowser: Array<{ browser: string; views: number }>;
  viewsByPath: Array<{ path: string; views: number }>;
}

export default function AnalyticsTab() {
  const [site, setSite] = useState<string>("all");
  const [days, setDays] = useState<number>(30);

  const { data: stats, isLoading } = useQuery<AnalyticsStats>({
    queryKey: ["/api/analytics/stats", site, days],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (site !== "all") params.append("site", site);
      params.append("days", String(days));
      const res = await fetch(`/api/analytics/stats?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate()}.${date.getMonth() + 1}`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Sajt</InputLabel>
          <Select
            value={site}
            onChange={(e) => setSite(e.target.value)}
            label="Sajt"
            data-testid="select-site"
          >
            <MenuItem value="all">Svi sajtovi</MenuItem>
            <MenuItem value="marketing">Marketing (dzematapp.com)</MenuItem>
            <MenuItem value="app">App (app.dzematapp.com)</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            label="Period"
            data-testid="select-days"
          >
            <MenuItem value={7}>7 dana</MenuItem>
            <MenuItem value={30}>30 dana</MenuItem>
            <MenuItem value={90}>90 dana</MenuItem>
            <MenuItem value={365}>Godina</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <TrendingUp size={24} color="#3949AB" />
            <Typography variant="h4" sx={{ mt: 1 }} data-testid="text-total-views">
              {stats?.totalViews || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ukupno posjeta
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Users size={24} color="#1E88E5" />
            <Typography variant="h4" sx={{ mt: 1 }} data-testid="text-unique-visitors">
              {stats?.uniqueVisitors || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Jedinstvenih posjetilaca
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Monitor size={24} color="#26A69A" />
            <Typography variant="h4" sx={{ mt: 1 }}>
              {stats?.viewsByDevice?.[0]?.device || "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Top uređaj
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ p: 2, textAlign: "center" }}>
            <Globe size={24} color="#7CB342" />
            <Typography variant="h4" sx={{ mt: 1 }}>
              {stats?.viewsByCountry?.[0]?.country || "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Top država
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Posjete po danu</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats?.viewsByDay || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={formatDate} />
                <YAxis />
                <Tooltip labelFormatter={(label) => new Date(label).toLocaleDateString("bs")} />
                <Line type="monotone" dataKey="views" stroke="#3949AB" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Po državi</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats?.viewsByCountry || []}
                  dataKey="views"
                  nameKey="country"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ country, percent }) => `${country} (${(percent * 100).toFixed(0)}%)`}
                >
                  {(stats?.viewsByCountry || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Po uređaju</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats?.viewsByDevice || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="device" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="views" fill="#1E88E5" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Po operativnom sistemu</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats?.viewsByOS || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="os" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="views" fill="#26A69A" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Po browseru</Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats?.viewsByBrowser || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="browser" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="views" fill="#AB47BC" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Top stranice</Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {(stats?.viewsByPath || []).map((item, index) => (
                <Chip
                  key={index}
                  label={`${item.path} (${item.views})`}
                  size="small"
                  sx={{ bgcolor: COLORS[index % COLORS.length], color: "white" }}
                />
              ))}
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
