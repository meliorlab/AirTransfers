import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminZones() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold">Zones</h1>
          <p className="text-muted-foreground mt-1">Manage service zones</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Zone Management</CardTitle>
            <CardDescription>Coming soon - Configure service zones and coverage areas</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This feature will allow you to create and manage different service zones.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
