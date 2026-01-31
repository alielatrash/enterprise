'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import type { TruckType } from '@prisma/client'
import { PageHeader } from '@/components/layout'
import { RepositoryTable } from '@/components/repositories/repository-table'
import { EntityFormDialog } from '@/components/repositories/entity-form-dialog'
import {
  useTruckTypes,
  useCreateTruckType,
  useUpdateTruckType,
  useDeleteTruckType,
} from '@/hooks/use-repositories'
import { createTruckTypeSchema } from '@/lib/validations/repositories'
import { useDebounce } from '@/hooks/use-debounce'

const columns = [
  { key: 'name', label: 'Name' },
]

const formFields = [
  { name: 'name', label: 'Name', placeholder: 'Enter truck type (e.g., Curtainside, Flatbed, Reefer)', required: true },
]

const defaultValues = { name: '' }

export default function TruckTypesPage() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<TruckType | null>(null)

  const { data, isLoading } = useTruckTypes({ q: debouncedSearch, isActive: true })
  const createMutation = useCreateTruckType()
  const updateMutation = useUpdateTruckType()
  const deleteMutation = useDeleteTruckType()

  const handleAdd = useCallback(() => {
    setEditingItem(null)
    setIsDialogOpen(true)
  }, [])

  const handleEdit = useCallback((item: TruckType) => {
    setEditingItem(item)
    setIsDialogOpen(true)
  }, [])

  const handleDelete = useCallback(async (item: TruckType) => {
    if (!confirm(`Are you sure you want to deactivate "${item.name}"?`)) return
    try {
      await deleteMutation.mutateAsync(item.id)
      toast.success('Truck type deactivated successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to deactivate truck type')
    }
  }, [deleteMutation])

  const handleSubmit = async (formData: { name: string }) => {
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ id: editingItem.id, ...formData })
        toast.success('Truck type updated successfully')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Truck type created successfully')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
      throw error
    }
  }

  return (
    <div>
      <PageHeader
        title="Truck Types"
        description="Manage truck types for planning"
      />

      <RepositoryTable
        data={data?.data}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Search truck types..."
        onSearch={setSearch}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        addButtonLabel="Add Truck Type"
      />

      <EntityFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        title={editingItem ? 'Edit Truck Type' : 'Add Truck Type'}
        description={editingItem ? 'Update truck type details' : 'Add a new truck type'}
        schema={createTruckTypeSchema}
        fields={formFields}
        defaultValues={editingItem ? { name: editingItem.name } : defaultValues}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
        isEdit={!!editingItem}
      />
    </div>
  )
}
