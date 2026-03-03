import type { DetailedHTMLProps, HTMLAttributes } from 'react';

type El<T = object> = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & T;

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'y-appbar': El;
      'y-avatar': El<{
        src?: string;
        alt?: string;
        size?: string;
        color?: string;
      }>;
      'y-badge': El<{
        color?: string;
        size?: string;
      }>;
      'y-button': El<{
        'left-icon'?: string;
        'right-icon'?: string;
        color?: string;
        size?: 'small' | 'medium' | 'large';
        'style-type'?: 'outlined' | 'filled' | 'flat';
        type?: string;
        disabled?: boolean | string;
        name?: string;
        value?: string;
        autofocus?: boolean | string;
        form?: string;
        formaction?: string;
        formenctype?: string;
        formmethod?: string;
        formnovalidate?: boolean | string;
        formtarget?: string;
      }>;
      'y-card': El;
      'y-checkbox': El<{
        name?: string;
        value?: string;
        checked?: boolean | string;
        disabled?: boolean | string;
        color?: string;
        size?: string;
      }>;
      'y-dialog': El<{
        open?: boolean | string;
        size?: string;
      }>;
      'y-drawer': El<{
        open?: boolean | string;
        position?: string;
      }>;
      'y-input': El<{
        type?: string;
        name?: string;
        value?: string;
        placeholder?: string;
        disabled?: boolean | string;
        required?: boolean | string;
        color?: string;
        size?: string;
        label?: string;
      }>;
      'y-menu': El;
      'y-panel': El<{ open?: boolean | string }>;
      'y-panelbar': El;
      'y-progress': El<{
        value?: string | number;
        max?: string | number;
        color?: string;
        size?: string;
      }>;
      'y-radio': El<{
        name?: string;
        value?: string;
        checked?: boolean | string;
        disabled?: boolean | string;
        color?: string;
        size?: string;
      }>;
      'y-select': El<{
        name?: string;
        value?: string;
        disabled?: boolean | string;
        multiple?: boolean | string;
        color?: string;
        size?: string;
        placeholder?: string;
      }>;
      'y-slider': El<{
        name?: string;
        value?: string | number;
        min?: string | number;
        max?: string | number;
        step?: string | number;
        disabled?: boolean | string;
        color?: string;
        size?: string;
      }>;
      'y-switch': El<{
        name?: string;
        checked?: boolean | string;
        disabled?: boolean | string;
        color?: string;
        size?: string;
      }>;
      'y-table': El;
      'y-tabs': El;
      'y-tag': El<{
        color?: string;
        size?: string;
        removable?: boolean | string;
      }>;
      'y-theme': El<{
        theme?: string;
        color?: string;
        mode?: string;
        'theme-path'?: string;
      }>;
      'y-toast': El<{
        open?: boolean | string;
        color?: string;
        position?: string;
        duration?: string | number;
      }>;
      'y-tooltip': El<{
        content?: string;
        position?: string;
        color?: string;
      }>;
    }
  }
}
