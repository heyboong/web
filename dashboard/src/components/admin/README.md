# Admin UI Components

Professional admin UI component library for enhanced user experience.

## Components

### 📊 StatsCard
Enhanced statistics card with gradients, trends, and loading states.

```jsx
import { StatsCard } from 'components/admin';

<StatsCard
  title="Total Users"
  value="1,234"
  icon={UserIcon}
  color="primary" // primary, success, warning, error, info, purple
  trend="up" // up or down
  trendValue="+12%"
  description="from last month"
  loading={false}
/>
```

### 🔍 SearchBar
Debounced search with clear functionality.

```jsx
import { SearchBar } from 'components/admin';

<SearchBar
  value={searchTerm}
  onChange={(value) => setSearchTerm(value)}
  placeholder="Search users..."
  debounce={300}
  onClear={() => handleClear()}
/>
```

### 🏷️ FilterBadge & FilterBadgeGroup
Display and manage active filters.

```jsx
import { FilterBadgeGroup } from 'components/admin';

<FilterBadgeGroup
  filters={[
    { key: 'status', label: 'Status', value: 'Active' },
    { key: 'role', label: 'Role', value: 'Admin' }
  ]}
  onRemoveFilter={(key) => removeFilter(key)}
  onClearAll={() => clearAllFilters()}
/>
```

### 📄 PageHeader
Consistent page headers with breadcrumbs, stats, and actions.

```jsx
import { PageHeader } from 'components/admin';

<PageHeader
  title="User Management"
  description="Manage users and permissions"
  icon={UserGroupIcon}
  breadcrumbs={[
    { label: 'Admin', href: '/admin' },
    { label: 'Users' }
  ]}
  actions={
    <Button>Add User</Button>
  }
  stats={[
    { label: 'Total', value: 1234, icon: UserIcon }
  ]}
/>
```

### 🗂️ EmptyState
User-friendly empty states.

```jsx
import { EmptyState } from 'components/admin';

<EmptyState
  icon={UserGroupIcon}
  title="No users found"
  description="Get started by adding your first user"
  action={() => openCreateModal()}
  actionLabel="Add User"
/>
```

### ⏳ TableSkeleton
Loading skeleton for tables.

```jsx
import { TableSkeleton } from 'components/admin';

<TableSkeleton rows={10} columns={6} />
```

### ⚡ QuickActions
Dropdown menu for table row actions.

```jsx
import { QuickActions } from 'components/admin';

<QuickActions
  actions={[
    {
      label: 'Edit',
      icon: PencilIcon,
      onClick: () => handleEdit(user)
    },
    {
      label: 'Delete',
      icon: TrashIcon,
      onClick: () => handleDelete(user),
      danger: true
    }
  ]}
/>
```

### 📃 Pagination
Professional pagination component.

```jsx
import { Pagination } from 'components/admin';

<Pagination
  currentPage={page}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={perPage}
  onPageChange={(newPage) => setPage(newPage)}
/>
```

### 🏷️ StatusBadge
Reusable status badge with icons.

```jsx
import { StatusBadge } from 'components/admin';

<StatusBadge status="active" showIcon={true} />
// Supports: active, inactive, suspended, pending, draft, completed, failed, cancelled
```

## Usage Example

Complete admin page example:

```jsx
import { 
  PageHeader, 
  StatsCard, 
  SearchBar, 
  FilterBadgeGroup,
  TableSkeleton,
  EmptyState,
  QuickActions,
  Pagination,
  StatusBadge 
} from 'components/admin';

export default function AdminUsers() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: 'all' });

  return (
    <Page>
      <PageHeader
        title="User Management"
        description="Manage system users"
        icon={UserGroupIcon}
        actions={<Button>Add User</Button>}
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard title="Total" value="1,234" icon={UserIcon} color="primary" />
        <StatsCard title="Active" value="987" icon={CheckIcon} color="success" />
        <StatsCard title="Inactive" value="247" icon={XIcon} color="warning" />
        <StatsCard title="Suspended" value="12" icon={NoSymbolIcon} color="error" />
      </div>

      <Card className="p-6">
        <SearchBar
          value={filters.search}
          onChange={(val) => setFilters({ ...filters, search: val })}
        />
        
        <FilterBadgeGroup
          filters={activeFilters}
          onRemoveFilter={removeFilter}
          onClearAll={clearFilters}
        />

        {loading ? (
          <TableSkeleton rows={10} columns={5} />
        ) : users.length === 0 ? (
          <EmptyState
            title="No users"
            action={openCreate}
            actionLabel="Add User"
          />
        ) : (
          <table>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td><StatusBadge status={user.status} /></td>
                <td>
                  <QuickActions actions={getActions(user)} />
                </td>
              </tr>
            ))}
          </table>
        )}

        <Pagination
          currentPage={page}
          totalPages={pages}
          totalItems={total}
          itemsPerPage={perPage}
          onPageChange={setPage}
        />
      </Card>
    </Page>
  );
}
```

## Color Schemes

**StatsCard colors:**
- `primary` - Blue
- `success` - Green
- `warning` - Amber
- `error` - Red
- `info` - Cyan
- `purple` - Purple

## Best Practices

1. **Always use loading states** - Show TableSkeleton or StatsCard loading prop
2. **Implement empty states** - Use EmptyState when no data
3. **Debounce search** - SearchBar handles this automatically
4. **Show active filters** - Use FilterBadgeGroup to display active filters
5. **Consistent headers** - Use PageHeader on all admin pages
6. **Responsive design** - All components are mobile-friendly
