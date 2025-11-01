import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminRates() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Rates</h1>
          <p className="text-muted-foreground mt-1">Manage base rates by vehicle class and party size</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Rate Management</CardTitle>
            <CardDescription>Coming soon - Configure base rates for different vehicle classes and party sizes</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This feature will allow you to set pricing based on vehicle class (Standard, Luxury, Minivan) and party size thresholds.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
