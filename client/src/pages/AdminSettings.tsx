import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Settings, Users, DollarSign } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LargePartySurcharge {
  amount: string;
  minPartySize: string;
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [surchargeAmount, setSurchargeAmount] = useState("");
  const [minPartySize, setMinPartySize] = useState("");

  const { data: surchargeSettings, isLoading } = useQuery<LargePartySurcharge>({
    queryKey: ["/api/settings/large-party-surcharge"],
  });

  useEffect(() => {
    if (surchargeSettings) {
      setSurchargeAmount(surchargeSettings.amount);
      setMinPartySize(surchargeSettings.minPartySize);
    }
  }, [surchargeSettings]);

  const saveSurchargeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/settings", {
        key: "large_party_surcharge_amount",
        value: surchargeAmount,
        description: "Additional fee charged when party size is equal to or exceeds the minimum threshold",
      });
      await apiRequest("POST", "/api/admin/settings", {
        key: "large_party_min_size",
        value: minPartySize,
        description: "Minimum number of travelers to trigger the large party surcharge",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/large-party-surcharge"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!surchargeAmount || parseFloat(surchargeAmount) < 0) {
      toast({ title: "Please enter a valid surcharge amount", variant: "destructive" });
      return;
    }
    
    if (!minPartySize || parseInt(minPartySize) < 2) {
      toast({ title: "Minimum party size must be at least 2", variant: "destructive" });
      return;
    }
    
    saveSurchargeMutation.mutate();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Configure pricing rules and system options</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Large Party Surcharge
            </CardTitle>
            <CardDescription>
              Add an extra fee for bookings with larger groups
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4 text-muted-foreground">Loading...</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="minPartySize" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Minimum Party Size
                    </Label>
                    <Input
                      id="minPartySize"
                      data-testid="input-min-party-size"
                      type="number"
                      min="2"
                      step="1"
                      value={minPartySize}
                      onChange={(e) => setMinPartySize(e.target.value)}
                      placeholder="4"
                    />
                    <p className="text-xs text-muted-foreground">
                      Surcharge applies when party size is this number or more
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="surchargeAmount" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Surcharge Amount (USD)
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        id="surchargeAmount"
                        data-testid="input-surcharge-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={surchargeAmount}
                        onChange={(e) => setSurchargeAmount(e.target.value)}
                        placeholder="20"
                        className="pl-7"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Additional fee added to the booking total
                    </p>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-md p-4">
                  <p className="text-sm">
                    <strong>Current Setting:</strong> A ${surchargeAmount || "20"} surcharge will be added to bookings with {minPartySize || "4"} or more travelers.
                  </p>
                </div>

                <Button
                  type="submit"
                  data-testid="button-save-settings"
                  disabled={saveSurchargeMutation.isPending}
                >
                  {saveSurchargeMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
