import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TransactionForm from '../../../components/kokonutui/transaction-form'
import * as documentsClient from '@/lib/documents-client'

// Mock documents-client
vi.mock('@/lib/documents-client', () => ({
  uploadAndEnqueueProjectDocument: vi.fn()
}))

// Mock UI components that might cause issues or need simplified rendering
vi.mock('@/components/ui/select', () => ({
  Select: ({ onValueChange, children }: any) => (
    <div 
      data-testid="select" 
      onClick={(e: any) => {
        const value = e.target.getAttribute('data-value') || 'test-value'
        onValueChange && onValueChange(value)
      }}
    >
      {children}
    </div>
  ),
  SelectTrigger: ({ children }: any) => <button>{children}</button>,
  SelectValue: () => <span>Select Value</span>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ value, children, onClick }: any) => (
    <div 
      data-testid={`select-item-${value}`} 
      data-value={value} 
      className="select-item"
      onClick={onClick}
    >
      {children}
    </div>
  ),
  Separator: () => <hr />,
}))

describe('TransactionForm', () => {
  const mockOnSuccess = vi.fn()
  
  beforeEach(() => {
    mockOnSuccess.mockClear()
    global.fetch = vi.fn()
    vi.mocked(documentsClient.uploadAndEnqueueProjectDocument).mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders form elements', async () => {
    render(<TransactionForm />)
    expect(screen.getByRole('heading', { name: '거래 등록' })).toBeInTheDocument()
    expect(screen.getByLabelText('금액 *')).toBeInTheDocument()
    // Other fields might need async wait if they depend on useEffect (projects)
  })

  it('loads projects on mount', async () => {
    const mockProjects = [{ id: 'p1', name: 'Project 1' }]
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projects: mockProjects })
    } as any)

    render(<TransactionForm />)

    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects')
    })
  })

  it('handles project load failure gracefully', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Failed'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<TransactionForm />)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('프로젝트 목록 로딩 실패:', expect.any(Error))
    })
  })

  it('handles failed project loading (non-network error)', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({})
    } as any)

    render(<TransactionForm />)

    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects')
    })
    // Projects should remain empty, so project select should not appear
    expect(screen.queryByLabelText('프로젝트 (선택사항)')).not.toBeInTheDocument()
  })

  it('renders without project select when projects are empty', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ projects: [] })
    } as any)

    render(<TransactionForm />)

    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects')
    })
    expect(screen.queryByLabelText('프로젝트 (선택사항)')).not.toBeInTheDocument()
  })

  it('switches transaction type to INCOME', async () => {
    const user = userEvent.setup()
    render(<TransactionForm />)
    
    const incomeRadio = screen.getByLabelText('수입')
    await user.click(incomeRadio)
    
    // Check if category select contents changed (optional, but good for verification)
    // We can just verify the state change doesn't crash and covers the code branch
    expect(incomeRadio).toBeChecked()
  })

  it('submits form successfully', async () => {
    const user = userEvent.setup()
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    } as any) // For projects (initial) and submit

    render(<TransactionForm onSuccess={mockOnSuccess} />)

    // Fill form
    await user.type(screen.getByLabelText('금액 *'), '10000')
    await user.type(screen.getByLabelText('설명'), 'Test Transaction')
    
    // Select category (mocked select interaction might be tricky, let's assume we can set it via prop or simplified mock)
    // Since we mocked Select to trigger onValueChange on click for simplicity in this specific test setup:
    fireEvent.click(screen.getAllByTestId('select')[0]) // First select is Category (or we should be more specific)
    
    // Wait for "test-value" to be set (implicit)

    const submitBtn = screen.getByRole('button', { name: '거래 등록' })
    await user.click(submitBtn)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
          '/api/financial/transactions',
          expect.objectContaining({ method: 'POST' })
      )
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(screen.getByText('거래가 성공적으로 등록되었습니다.')).toBeInTheDocument()
    })
  })

  it('handles submission error', async () => {
    const user = userEvent.setup()
    vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true, json: async () => ({ projects: [] })
    } as any) // projects
    .mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Backend Error' })
    } as any) // submit

    render(<TransactionForm />)

    await user.type(screen.getByLabelText('금액 *'), '10000')
    // Trigger category selection mock
    // Note: In a real robust test, we would use proper Select interaction. Here we rely on the mocked behavior.
    fireEvent.click(screen.getAllByTestId('select')[0]) 

    await user.click(screen.getByRole('button', { name: '거래 등록' }))

    await waitFor(() => {
      expect(screen.getByText('Backend Error')).toBeInTheDocument()
    })
  })
  
    it('handles submission network error', async () => {
    const user = userEvent.setup()
     vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true, json: async () => ({ projects: [] })
    } as any) // projects
    .mockRejectedValueOnce(new Error('Network Error')) // submit

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<TransactionForm />)

    await user.type(screen.getByLabelText('금액 *'), '10000')
    fireEvent.click(screen.getAllByTestId('select')[0]) 

    await user.click(screen.getByRole('button', { name: '거래 등록' }))

    await waitFor(() => {
      expect(screen.getByText('네트워크 오류가 발생했습니다.')).toBeInTheDocument()
    })
  })


  it('requires project selection for receipt upload', async () => {
    render(<TransactionForm />)
    
    const fileInput = screen.getByLabelText('영수증/문서 첨부 (선택사항)')
    const file = new File(['content'], 'receipt.pdf', { type: 'application/pdf' })
    
    await userEvent.upload(fileInput, file)
    
    expect(screen.getByText('영수증/문서를 첨부하려면 프로젝트를 먼저 선택해주세요.')).toBeInTheDocument()
  })

  it('uploads receipt successfully', async () => {
    const mockProjects = [{ id: 'p1', name: 'Project 1' }]
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ projects: mockProjects })
    } as any)
    
    vi.mocked(documentsClient.uploadAndEnqueueProjectDocument).mockResolvedValue({ documentId: 'doc-123' })

    render(<TransactionForm />)
    
    // Wait for projects
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())

    // Select project (2nd select)
    const selects = screen.getAllByTestId('select')
    fireEvent.click(selects[1]) // Assuming 2nd is project select
    
    const fileInput = screen.getByLabelText('영수증/문서 첨부 (선택사항)')
    const file = new File(['content'], 'receipt.pdf', { type: 'application/pdf' })
    
    await userEvent.upload(fileInput, file)
    
    await waitFor(() => {
        expect(documentsClient.uploadAndEnqueueProjectDocument).toHaveBeenCalled()
        expect(screen.getByText('문서 ID: doc-123')).toBeInTheDocument()
    })
  })
  
  it('displays validation errors for missing required fields', async () => {
    const user = userEvent.setup()
    render(<TransactionForm />)
    
    // Clear date (default is today)
    const dateInput = screen.getByLabelText('날짜 *')
    await user.clear(dateInput)

    // Submit without filling amount or selecting category
    await user.click(screen.getByRole('button', { name: '거래 등록' }))

    await waitFor(() => {
        expect(screen.getByText('금액을 입력해주세요')).toBeInTheDocument()
        expect(screen.getByText('카테고리를 선택하세요')).toBeInTheDocument()
        expect(screen.getByText('날짜를 선택해주세요')).toBeInTheDocument()
    })
  })

  it('handles receipt upload error', async () => {
      const mockProjects = [{ id: 'p1', name: 'Project 1' }]
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ projects: mockProjects })
      } as any)
      
      vi.mocked(documentsClient.uploadAndEnqueueProjectDocument).mockRejectedValue(new Error('Upload Fail'))
  
      render(<TransactionForm />)
      
      await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  
      const selects = screen.getAllByTestId('select')
      fireEvent.click(selects[1])
      
      const fileInput = screen.getByLabelText('영수증/문서 첨부 (선택사항)')
      const file = new File(['content'], 'receipt.pdf', { type: 'application/pdf' })
      
      await userEvent.upload(fileInput, file)
      
      await waitFor(() => {
          expect(screen.getByText('Upload Fail')).toBeInTheDocument()
      })
  })

  it('clears project selection when none is selected', async () => {
    const user = userEvent.setup()
    const mockProjects = [{ id: 'p1', name: 'Project 1' }]
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ projects: mockProjects })
    } as any)

    render(<TransactionForm />)
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())

    // First, verify items are present.
    // Project 1 item:
    const projectItem = screen.getByTestId('select-item-p1')
    fireEvent.click(projectItem) // This should trigger Select onClick via bubbling with e.target having data-value="p1"
    
    // Now select 'none'
    const noneItem = screen.getByTestId('select-item-none')
    fireEvent.click(noneItem)
    
    // Verify upload text changes back to "requires project"
    const fileInput = screen.getByLabelText('영수증/문서 첨부 (선택사항)')
    const file = new File(['content'], 'receipt.pdf', { type: 'application/pdf' })
    await userEvent.upload(fileInput, file)
    
    expect(screen.getByText('영수증/문서를 첨부하려면 프로젝트를 먼저 선택해주세요.')).toBeInTheDocument()
  })
})
