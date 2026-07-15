import { useSelector } from "react-redux"
import type { RootState } from "@/store"
import { PageHeader } from "@/components/layout/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

export default function Profile() {
  const user = useSelector((state: RootState) => state.auth.user)

  if (!user) {
    return null
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      <PageHeader title="Profile" description="Manage your personal profile and account settings." />
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 shadow-sm border">
          <CardContent className="pt-8 flex flex-col items-center">
            <Avatar className="h-28 w-28 mb-6 border-4 border-background shadow-md">
              <AvatarFallback className="text-4xl bg-primary/10 text-primary font-bold">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-2xl font-semibold">{user.name}</h3>
            <p className="text-sm font-medium text-muted-foreground capitalize mt-2 px-3 py-1 bg-secondary rounded-full">{user.role}</p>
          </CardContent>
        </Card>
        
        <div className="md:col-span-2 flex flex-col gap-6">
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>View and update your personal details.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" defaultValue={user.name} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" defaultValue={user.email} disabled />
                  <p className="text-xs text-muted-foreground">Email addresses cannot be changed.</p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Account Role</Label>
                  <Input id="role" defaultValue={user.role} className="capitalize" disabled />
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button>Save Changes</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border">
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input id="current-password" type="password" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input id="new-password" type="password" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input id="confirm-password" type="password" />
                </div>
                <div className="flex justify-end mt-4">
                  <Button variant="secondary">Update Password</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
