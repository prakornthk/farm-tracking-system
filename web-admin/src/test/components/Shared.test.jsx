import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoadingSpinner, ErrorAlert, EmptyState, ConfirmModal } from '../../components/Shared';

describe('Shared Components', () => {

  describe('LoadingSpinner', () => {
    it('renders with default size', () => {
      render(<LoadingSpinner />);
      const spinner = screen.getByRole('status', { name: /กำลังโหลด/i });
      expect(spinner).toBeInTheDocument();
    });

    it('renders with small size', () => {
      render(<LoadingSpinner size="sm" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders with large size', () => {
      render(<LoadingSpinner size="lg" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('ErrorAlert', () => {
    it('renders error message', () => {
      render(<ErrorAlert message="เกิดข้อผิดพลาดบางอย่าง" />);
      expect(screen.getByRole('alert')).toHaveTextContent('เกิดข้อผิดพลาดบางอย่าง');
    });

    it('renders default message when no message provided', () => {
      render(<ErrorAlert />);
      expect(screen.getByRole('alert')).toHaveTextContent('เกิดข้อผิดพลาด');
    });

    it('renders retry button when onRetry provided', async () => {
      const user = userEvent.setup();
      const onRetry = vi.fn();
      render(<ErrorAlert message="Error" onRetry={onRetry} />);
      await user.click(screen.getByText('ลองใหม่'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('does not render retry button when onRetry not provided', () => {
      render(<ErrorAlert message="Error" />);
      expect(screen.queryByText('ลองใหม่')).not.toBeInTheDocument();
    });
  });

  describe('EmptyState', () => {
    it('renders title and description', () => {
      render(<EmptyState title="ไม่มีข้อมูล" description="กรุณาเพิ่มข้อมูลใหม่" />);
      expect(screen.getByText('ไม่มีข้อมูล')).toBeInTheDocument();
      expect(screen.getByText('กรุณาเพิ่มข้อมูลใหม่')).toBeInTheDocument();
    });

    it('renders action button when action provided', async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<EmptyState title="ว่าง" description="ไม่มีรายการ" action={{ label: 'เพิ่มใหม่', onClick }} />);
      await user.click(screen.getByText('เพิ่มใหม่'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not render action button when action not provided', () => {
      render(<EmptyState title="ว่าง" description="ไม่มีรายการ" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('ConfirmModal', () => {
    it('renders when open is true', () => {
      render(
        <ConfirmModal
          open={true}
          title="ลบรายการ"
          message="ยืนยันการลบ?"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.getByText('ลบรายการ')).toBeInTheDocument();
      expect(screen.getByText('ยืนยันการลบ?')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(
        <ConfirmModal
          open={false}
          title="ลบรายการ"
          message="ยืนยันการลบ?"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      expect(screen.queryByText('ลบรายการ')).not.toBeInTheDocument();
    });

    it('calls onConfirm when confirm button clicked', async () => {
      const user = userEvent.setup();
      const onConfirm = vi.fn();
      const onCancel = vi.fn();
      render(
        <ConfirmModal
          open={true}
          title="ลบรายการ"
          message="ยืนยัน?"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );
      await user.click(screen.getByRole('button', { name: /ยืนยัน/i }));
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('calls onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      render(
        <ConfirmModal
          open={true}
          title="ลบรายการ"
          message="ยืนยัน?"
          onConfirm={vi.fn()}
          onCancel={onCancel}
        />
      );
      await user.click(screen.getByRole('button', { name: /ยกเลิก/i }));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('shows loading state on confirm button', () => {
      render(
        <ConfirmModal
          open={true}
          title="ลบรายการ"
          message="ยืนยัน?"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          loading={true}
        />
      );
      expect(screen.getByText('กำลัง...')).toBeInTheDocument();
    });

    it('shows error message when error prop provided', () => {
      render(
        <ConfirmModal
          open={true}
          title="ลบรายการ"
          message="ยืนยัน?"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
          error="ลบไม่สำเร็จ"
        />
      );
      expect(screen.getByText('ลบไม่สำเร็จ')).toBeInTheDocument();
    });

    it('has correct ARIA attributes', () => {
      render(
        <ConfirmModal
          open={true}
          title="ลบรายการ"
          message="ยืนยัน?"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      );
      const dialog = screen.getByRole('dialog', { name: /ลบรายการ/i });
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });
  });
});
