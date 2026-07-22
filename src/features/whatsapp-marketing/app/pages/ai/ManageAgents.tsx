// @ts-nocheck
import { Card, CardContent, CardHeader, CardTitle } from "@whatsapp/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@whatsapp/components/ui/table";
import { Button } from "@whatsapp/components/ui/button";
import { Bot, Trash2, Edit } from "lucide-react";

export default function ManageAgents() {
  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-3xl font-bold tracking-tight">Manage AI Agents</h2>
        <Card>
          <CardHeader>
             <CardTitle>Active Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Conversations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    Support Bot Level 1
                  </TableCell>
                  <TableCell>GPT-4o</TableCell>
                  <TableCell>1,234</TableCell>
                  <TableCell><span className="text-green-600 font-medium">Active</span></TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium flex items-center gap-2">
                    <Bot className="h-4 w-4 text-primary" />
                    Sales Assistant
                  </TableCell>
                  <TableCell>GPT-3.5-Turbo</TableCell>
                  <TableCell>543</TableCell>
                  <TableCell><span className="text-gray-500 font-medium">Paused</span></TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
