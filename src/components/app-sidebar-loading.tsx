import { Sidebar, SidebarContent, SidebarGroup } from '~/components/ui/sidebar'

export const AppSidebarLoading = () => (
  <Sidebar variant="inset" className="dark scheme-only-dark max-lg:p-3 lg:pe-1">
    <div className="animate-pulse">
      <div className="h-16 border-b px-4">
        <div className="flex h-full items-center justify-between">
          <div className="bg-muted h-8 w-8 rounded" />
          <div className="bg-muted h-8 w-8 rounded" />
        </div>
      </div>
      <SidebarContent className="mt-3 gap-0 border-t pt-3">
        <SidebarGroup className="px-1">
          <div className="bg-muted h-6 w-24 rounded" />
        </SidebarGroup>
        <SidebarGroup className="mt-3 border-t px-1 pt-4">
          <div className="bg-muted mb-4 h-4 w-32 rounded" />
          <div className="space-y-2">
            {['personal', 'work', 'family', 'holidays', 'birthdays'].map(
              item => (
                <div
                  key={`loading-${item}`}
                  className="bg-muted h-10 rounded"
                />
              ),
            )}
          </div>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto border-t p-4">
        <div className="bg-muted h-12 rounded" />
      </div>
    </div>
  </Sidebar>
)
