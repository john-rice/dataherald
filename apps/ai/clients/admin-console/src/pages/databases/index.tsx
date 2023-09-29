import DatabaseConnection from '@/components/databases/database-connection'
import DatabasesError from '@/components/databases/error'
import LoadingDatabases from '@/components/databases/loading'
import PageLayout from '@/components/layout/page-layout'
import { Button } from '@/components/ui/button'
import { ContentBox } from '@/components/ui/content-box'
import { ToastAction } from '@/components/ui/toast'
import { Toaster } from '@/components/ui/toaster'
import { TreeNode, TreeView } from '@/components/ui/tree-view'
import { TreeProvider, useTree } from '@/components/ui/tree-view-context'
import { toast } from '@/components/ui/use-toast'
import useDatabases from '@/hooks/api/useDatabases'
import useSynchronizeSchemas from '@/hooks/api/useSynchronizeSchemas'
import {
  formatTableSyncStatus,
  getDomainTableSyncStatusColor,
  getDomainTableSyncStatusIcon,
  isSelectableByStatus,
} from '@/lib/domain/database'
import { cn, renderIcon } from '@/lib/utils'
import { Databases } from '@/models/api'
import { withPageAuthRequired } from '@auth0/nextjs-auth0/client'
import { formatDistance } from 'date-fns'
import {
  Columns,
  Database as DatabaseIcon,
  Loader,
  RefreshCw,
  Table2,
  UploadCloud,
} from 'lucide-react'
import { FC, useEffect, useMemo, useState } from 'react'

const mapDatabaseToTreeData = (databases: Databases): TreeNode =>
  databases.map((database) => ({
    id: database.db_connection_id,
    name: database.alias,
    icon: DatabaseIcon,
    selectable: database.tables.some((table) =>
      isSelectableByStatus(table.sync_status),
    ),
    defaultOpen: true,
    children: [
      {
        name: 'Tables',
        id: 'tables-root',
        icon: Table2,
        defaultOpen: true,
        children: database.tables.map((table) => ({
          id: table.name,
          name: table.name,
          icon: Table2,
          selectable: isSelectableByStatus(table.sync_status),
          slot: (
            <div
              className={cn(
                'flex items-center gap-2',
                getDomainTableSyncStatusColor(table.sync_status),
              )}
            >
              <div className="flex items-center gap-3 min-w-fit px-5">
                {renderIcon(getDomainTableSyncStatusIcon(table.sync_status), {
                  size: 16,
                  strokeWidth: 2,
                })}
                <span className="capitalize">
                  {formatTableSyncStatus(table.sync_status)}
                </span>
                {table.last_sync && (
                  <span className="text-gray-400">
                    {formatDistance(new Date(table.last_sync), new Date(), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
            </div>
          ),
          children: table.columns?.length
            ? [
                {
                  id: 'columns-root',
                  name: 'Columns',
                  icon: Columns,
                  children: table.columns.map((column) => ({
                    id: column,
                    name: column,
                    icon: Columns,
                  })),
                },
              ]
            : [],
        })),
      },
    ],
  }))[0] // TODO: Fix this when we support multiple databases

interface DatabaseDetailsProps {
  databases: Databases
  isRefreshing: boolean
  onRefresh: () => void
}

const DatabaseDetails: FC<DatabaseDetailsProps> = ({
  databases,
  isRefreshing,
  onRefresh,
}) => {
  const [isSynchronizing, setIsSynchronizing] = useState(false)
  const { selectedNodes, setSelectedNodes } = useTree()
  const synchronizeSchemas = useSynchronizeSchemas()
  const databaseTree = useMemo(
    () => (databases.length > 0 ? mapDatabaseToTreeData(databases) : null),
    [databases],
  )

  if (databaseTree === null) return <></>

  const resetSyncSelection = () => setSelectedNodes(new Set())

  const handleRefresh = async () => {
    await onRefresh()
  }

  const handleSynchronization = async () => {
    try {
      setIsSynchronizing(true)
      await synchronizeSchemas({
        db_connection_id: databaseTree.id,
        table_names: Array.from(selectedNodes),
      })
      toast({
        variant: 'success',
        title: 'Synchronization queued',
        description: `${selectedNodes.size} tables schemas were succesfully queued for synchronization.`,
      })
      setIsSynchronizing(false)
      resetSyncSelection()
      try {
        await handleRefresh()
        resetSyncSelection()
      } catch (e) {
        toast({
          variant: 'destructive',
          title: 'Ups! Something went wrong.',
          description: 'There was a problem refreshing your Database.',
          action: (
            <ToastAction
              altText="Try again"
              onClick={() => handleSynchronization()}
            >
              Try again
            </ToastAction>
          ),
        })
      }
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Ups! Something went wrong.',
        description:
          'There was a problem synchronizing your Database tables schemas.',
        action: (
          <ToastAction
            altText="Try again"
            onClick={() => handleSynchronization()}
          >
            Try again
          </ToastAction>
        ),
      })
    } finally {
      setIsSynchronizing(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between bg-gray-50 py-0">
        <h1 className="font-bold">Connected Database</h1>
        <div className="flex gap-3">
          <Button
            disabled={
              isSynchronizing || isRefreshing || selectedNodes.size === 0
            }
            onClick={handleSynchronization}
          >
            {isSynchronizing ? (
              <Loader size={18} className="mr-2 animate-spin" />
            ) : (
              <UploadCloud size={18} className="mr-2" />
            )}
            {`${!isSynchronizing ? `Synchronize` : 'Synchronizing'} ${
              selectedNodes.size
            } tables schemas`}
          </Button>
          <Button
            variant="outline"
            className="bg-gray-50"
            disabled={isRefreshing || isSynchronizing}
            onClick={handleRefresh}
          >
            <RefreshCw
              size={18}
              className={cn('mr-2', isRefreshing ? 'animate-spin' : '')}
            />{' '}
            {!isRefreshing ? 'Refresh' : 'Refreshing'}
          </Button>
        </div>
      </div>

      <TreeView rootNode={databaseTree} />
      <Toaster />
    </>
  )
}

const DatabasesPage: FC = () => {
  const { databases, isLoading, error, mutate } = useDatabases()
  const [connectingDB, setConnectingDB] = useState<boolean>(false)
  const [isSyncRefreshing, setIsSyncRefreshing] = useState(false)

  const refreshDatabases = () => mutate()

  const handleSyncRefresh = async () => {
    setIsSyncRefreshing(true)
    await refreshDatabases()
    setIsSyncRefreshing(false)
  }
  const handleDatabaseConnectionFinish = () => {
    setConnectingDB(false)
  }

  useEffect(() => {
    if (!isLoading) {
      if (databases?.length === 0) {
        setConnectingDB(true)
      } else {
        setConnectingDB(false)
      }
    }
  }, [isLoading, databases, connectingDB])

  let pageContent: JSX.Element = <></>

  if (error) {
    pageContent = <DatabasesError />
  } else if (isLoading && !connectingDB && !isSyncRefreshing) {
    pageContent = <LoadingDatabases />
  } else if (connectingDB) {
    pageContent = (
      <DatabaseConnection
        onConnected={refreshDatabases}
        onFinish={handleDatabaseConnectionFinish}
      />
    )
  } else {
    pageContent = (
      <TreeProvider>
        <DatabaseDetails
          databases={databases as Databases}
          isRefreshing={isSyncRefreshing}
          onRefresh={handleSyncRefresh}
        />
      </TreeProvider>
    )
  }
  return (
    <PageLayout>
      <ContentBox>{pageContent}</ContentBox>
    </PageLayout>
  )
}

export default withPageAuthRequired(DatabasesPage)
