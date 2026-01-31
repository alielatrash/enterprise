'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { City } from '@prisma/client'
import { PageHeader } from '@/components/layout'
import { RepositoryTable } from '@/components/repositories/repository-table'
import { EntityFormDialog } from '@/components/repositories/entity-form-dialog'
import {
  useCities,
  useCreateCity,
  useUpdateCity,
  useDeleteCity,
} from '@/hooks/use-repositories'
import { createCitySchema } from '@/lib/validations/repositories'
import { useDebounce } from '@/hooks/use-debounce'

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'nameAr', label: 'Arabic Name' },
  { key: 'code', label: 'Code' },
  { key: 'region', label: 'Region' },
]

const formFields = [
  { name: 'name', label: 'Name', placeholder: 'Enter city name', required: true },
  { name: 'nameAr', label: 'Arabic Name', placeholder: 'Enter Arabic name (optional)' },
  { name: 'code', label: 'Code', placeholder: 'Enter short code (e.g., RUH, JED)' },
  { name: 'region', label: 'Region', placeholder: 'Enter region (e.g., West, Central, East)' },
]

const defaultValues = { name: '', nameAr: '', code: '', region: '' }

export default function CitiesPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<City | null>(null)

  const { data, isLoading } = useCities({ q: debouncedSearch, isActive: true })
  const createMutation = useCreateCity()
  const updateMutation = useUpdateCity()
  const deleteMutation = useDeleteCity()

  const handleAdd = useCallback(() => {
    setEditingItem(null)
    setIsDialogOpen(true)
  }, [])

  const handleEdit = useCallback((item: City) => {
    setEditingItem(item)
    setIsDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async (item: City) => {
    if (!confirm(`Are you sure you want to deactivate "${item.name}"?`)) return
    try {
      await deleteMutation.mutateAsync(item.id)
      toast.success('City deactivated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate city')
    }
  }, [deleteMutation])

  const handleSubmit = async (formData: { name: string; nameAr?: string; code?: string; region?: string }) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, ...formData })
        toast.success('City updated successfully')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('City created successfully')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
      throw error
    }
  }

  return (
    <div>
      <PageHeader
        title="Cities"
        description="Manage pickup and dropoff cities"
      />

      <RepositoryTable
        data={data?.data}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search cities..."
        onSearch={setSearch}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel="Add City"
      />

      <EntityFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingItem ? 'Edit City' : 'Add City'}
        description={editingItem ? 'Update city details' : 'Add a new city to the system'}
        schema={createCitySchema}
        fields={formFields}
        defaultValues={editingItem ? {
          name: editingItem.name,
          nameAr: editingItem.nameAr || '',
          code: editingItem.code || '',
          region: editingItem.region || '',
        } : defaultValues}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
        isEdit={!!editingItem}
      />
    </div>
  )
}
