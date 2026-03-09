"use client"

import * as React from "react"
import { ArrowUpCircleIcon, ListIcon, SearchIcon } from "lucide-react";
import type { IconProps } from "@/components/icons";
import { IconBarChartIcon, IconCameraIcon, IconClipboardListIcon, IconDatabaseIcon, IconFileCodeIcon, IconFileIcon, IconFileTextIcon, IconFolderIcon, IconHelpCircleIcon, IconLayoutDashboardIcon, IconListIcon, IconSettingsIcon, IconUsersIcon } from "@/components/icons";

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: IconLayoutDashboardIcon,
    },
    {
      title: "Lifecycle",
      url: "#",
      icon: IconListIcon,
    },
    {
      title: "Analytics",
      url: "#",
      icon: IconBarChartIcon,
    },
    {
      title: "Projects",
      url: "#",
      icon: IconFolderIcon,
    },
    {
      title: "Team",
      url: "#",
      icon: IconUsersIcon,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCameraIcon,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileTextIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileCodeIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettingsIcon,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelpCircleIcon,
    },
    {
      title: "Search",
      url: "#",
      icon: SearchIcon,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabaseIcon,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconClipboardListIcon,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileIcon,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
