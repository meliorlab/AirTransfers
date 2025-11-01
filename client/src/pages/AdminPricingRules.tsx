import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminPricingRules() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Pricing Rules</h1>
          <p className="text-muted-foreground mt-1">Manage seasonal promotions and time-based pricing</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Pricing Rule Management</CardTitle>
            <CardDescription>Coming soon - Configure dynamic pricing rules</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This feature will allow you to create pricing rules for seasonal promotions, day-of-week adjustments, time-of-day pricing, and zone-specific rates.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
