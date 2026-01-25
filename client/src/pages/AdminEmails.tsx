import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import DOMPurify from "dompurify";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Edit, Users, Car, ShieldCheck, Zap, Info, Eye, Send } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EmailTemplate } from "@shared/schema";

interface PreviewData {
  subject: string;
  htmlBody: string;
  plainText: string;
}

export default function AdminEmails() {
  const { toast } = useToast();
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  
  const [previewingTemplate, setPreviewingTemplate] = useState<EmailTemplate | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [previewTab, setPreviewTab] = useState<string>("plain");
  
  const [sendTestTemplate, setSendTestTemplate] = useState<EmailTemplate | null>(null);
  const [testEmail, setTestEmail] = useState("");

  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email-templates"],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; subject: string; body: string }) => {
      return await apiRequest("PUT", `/api/admin/email-templates/${data.id}`, {
        subject: data.subject,
        body: data.body,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email-templates"] });
      toast({ title: "Email template updated successfully" });
      setEditingTemplate(null);
    },
    onError: () => {
      toast({ title: "Failed to update template", variant: "destructive" });
    },
  });

  const sendTestMutation = useMutation({
    mutationFn: async (data: { id: string; testEmail: string }) => {
      return await apiRequest("POST", `/api/admin/email-templates/${data.id}/send-test`, {
        testEmail: data.testEmail,
      });
    },
    onSuccess: () => {
      toast({ title: "Test email sent successfully", description: `Email sent to ${testEmail}` });
      setSendTestTemplate(null);
      setTestEmail("");
    },
    onError: () => {
      toast({ title: "Failed to send test email", variant: "destructive" });
    },
  });

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditSubject(template.subject);
    setEditBody(template.body);
  };

  const handleSave = () => {
    if (!editingTemplate) return;
    updateMutation.mutate({
      id: editingTemplate.id,
      subject: editSubject,
      body: editBody,
    });
  };

  const handlePreview = async (template: EmailTemplate) => {
    setPreviewingTemplate(template);
    setPreviewData(null);
    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}/preview`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
      } else {
        toast({ title: "Failed to load preview", variant: "destructive" });
        setPreviewingTemplate(null);
      }
    } catch {
      toast({ title: "Failed to load preview", variant: "destructive" });
      setPreviewingTemplate(null);
    }
  };

  const handleSendTest = (template: EmailTemplate) => {
    setSendTestTemplate(template);
    setTestEmail("");
  };

  const handleSendTestConfirm = () => {
    if (!sendTestTemplate || !testEmail) return;
    sendTestMutation.mutate({
      id: sendTestTemplate.id,
      testEmail,
    });
  };

  const getRecipientIcon = (type: string) => {
    switch (type) {
      case "customer":
        return <Users className="w-4 h-4" />;
      case "driver":
        return <Car className="w-4 h-4" />;
      case "admin":
        return <ShieldCheck className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRecipientBadgeVariant = (type: string): "default" | "secondary" | "outline" => {
    switch (type) {
      case "customer":
        return "default";
      case "driver":
        return "secondary";
      case "admin":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 data-testid="text-page-title" className="text-3xl font-heading font-bold flex items-center gap-2">
            <Mail className="w-8 h-8" />
            Email Templates
          </h1>
          <p data-testid="text-page-description" className="text-muted-foreground mt-1">
            Manage the content of emails sent to customers and drivers
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              About Email Templates
            </CardTitle>
            <CardDescription>
              These templates are used for automated emails. Use placeholder variables (shown in curly braces) that will be replaced with actual booking data when emails are sent. You can preview templates with sample data or send test emails to verify formatting.
            </CardDescription>
          </CardHeader>
        </Card>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading email templates...</div>
        ) : templates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No email templates found. Templates will be created automatically when the system starts.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email Name</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id} data-testid={`row-template-${template.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium" data-testid={`text-template-name-${template.id}`}>
                          {template.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground" data-testid={`text-trigger-${template.id}`}>
                        {template.triggerDescription}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getRecipientBadgeVariant(template.recipientType)}
                        className="flex items-center gap-1 w-fit"
                        data-testid={`badge-recipient-${template.id}`}
                      >
                        {getRecipientIcon(template.recipientType)}
                        {template.recipientType.charAt(0).toUpperCase() + template.recipientType.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm truncate max-w-xs block" data-testid={`text-subject-${template.id}`}>
                        {template.subject}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePreview(template)}
                          data-testid={`button-preview-${template.id}`}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleSendTest(template)}
                          data-testid={`button-send-test-${template.id}`}
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(template)}
                          data-testid={`button-edit-${template.id}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">Edit Email Template</DialogTitle>
            <DialogDescription>
              {editingTemplate && (
                <>
                  <span className="font-medium">{editingTemplate.name}</span>
                  <span className="mx-2">|</span>
                  <span>Sent to: {editingTemplate.recipientType}</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {editingTemplate && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-md p-4">
                <p className="text-sm font-medium mb-2">Available Variables:</p>
                <div className="flex flex-wrap gap-2">
                  {editingTemplate.availableVariables.map((variable) => (
                    <Badge
                      key={variable}
                      variant="outline"
                      className="font-mono text-xs"
                      data-testid={`badge-variable-${variable}`}
                    >
                      {`{{${variable}}}`}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Copy and paste these into your template. They will be replaced with actual data when emails are sent.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  data-testid="input-email-subject"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  placeholder="Email subject..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Email Body (HTML)</Label>
                <Textarea
                  id="body"
                  data-testid="input-email-body"
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  placeholder="Email content..."
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  You can use HTML for formatting. Use the variables above to personalize the email.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingTemplate(null)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              data-testid="button-save-template"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Template Dialog */}
      <Dialog open={!!previewingTemplate} onOpenChange={(open) => !open && setPreviewingTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-preview-dialog-title">Email Preview</DialogTitle>
            <DialogDescription>
              {previewingTemplate && (
                <>
                  Preview of <span className="font-medium">{previewingTemplate.name}</span> with sample data
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {!previewData ? (
            <div className="py-8 text-center text-muted-foreground">Loading preview...</div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-md p-4">
                <p className="text-sm font-medium mb-1">Subject:</p>
                <p className="text-base" data-testid="text-preview-subject">{previewData.subject}</p>
              </div>

              <Tabs value={previewTab} onValueChange={setPreviewTab}>
                <TabsList className="w-full">
                  <TabsTrigger value="plain" className="flex-1" data-testid="tab-plain-text">
                    Plain Text
                  </TabsTrigger>
                  <TabsTrigger value="html" className="flex-1" data-testid="tab-html">
                    HTML Preview
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="plain" className="mt-4">
                  <div className="bg-muted/30 rounded-md p-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm font-sans" data-testid="text-preview-plain">
                      {previewData.plainText}
                    </pre>
                  </div>
                </TabsContent>
                <TabsContent value="html" className="mt-4">
                  <div 
                    className="bg-white dark:bg-gray-900 rounded-md p-4 max-h-96 overflow-y-auto border"
                    data-testid="div-preview-html"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewData.htmlBody) }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPreviewingTemplate(null)}
              data-testid="button-close-preview"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Test Email Dialog */}
      <Dialog open={!!sendTestTemplate} onOpenChange={(open) => !open && setSendTestTemplate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle data-testid="text-send-test-dialog-title">Send Test Email</DialogTitle>
            <DialogDescription>
              {sendTestTemplate && (
                <>
                  Send a test version of <span className="font-medium">{sendTestTemplate.name}</span> with sample data
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email Address</Label>
              <Input
                id="test-email"
                type="email"
                data-testid="input-test-email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter email address..."
              />
              <p className="text-xs text-muted-foreground">
                The test email will be sent with sample booking data and [TEST] prefix in the subject line.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendTestTemplate(null)}
              data-testid="button-cancel-send-test"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTestConfirm}
              disabled={!testEmail || sendTestMutation.isPending}
              data-testid="button-confirm-send-test"
            >
              {sendTestMutation.isPending ? "Sending..." : "Send Test Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
