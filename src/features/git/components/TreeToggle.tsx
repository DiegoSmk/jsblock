import React from 'react';
import { useTranslation } from 'react-i18next';
import { List as ListIcon, Indent } from 'lucide-react';
import './GitStatus.css';

interface TreeToggleProps {
    count: number;
    isTreeView: boolean;
    onToggle: () => void;
}

export const TreeToggle: React.FC<TreeToggleProps> = ({ count, isTreeView, onToggle }) => {
    const { t } = useTranslation();

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (count > 0) onToggle();
            }}
            disabled={count === 0}
            title={count === 0 ? t('git.status.no_changes') : (isTreeView ? t('git.status.view_list') : t('git.status.view_tree'))}
            className="git-tree-toggle"
        >
            {isTreeView ? <ListIcon size={13} /> : <Indent size={13} />}
        </button>
    );
};
