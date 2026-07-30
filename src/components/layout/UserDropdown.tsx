import { useNavigate } from "@tanstack/react-router"
import { LogOut, Settings, User } from "lucide-react"
import { useDispatch, useSelector } from "react-redux"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { logoutUser } from "@/store/slices/authSlice"
import type { RootState } from "@/store"

export function UserDropdown() {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state: RootState) => state.auth.user)

  const handleLogout = () => {
    dispatch(logoutUser())
    navigate({ to: "/login" })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full p-0 hover:bg-[#FFF3E3] focus-visible:ring-[#C97816] dark:hover:bg-accent"
        >
          <Avatar className="h-8 w-8 ring-2 ring-[#F3D4AD] ring-offset-2 ring-offset-[#FFFCF8] dark:ring-border dark:ring-offset-background">
            <AvatarImage src="/avatars/01.png" alt="@user" />
            <AvatarFallback className="bg-[#C97816] font-semibold text-white">
              {user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || "user@example.com"}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
