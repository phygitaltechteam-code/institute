import {SidebarLinkGroupProps} from '@/types';
import {useEffect, useState} from 'react';

const SidebarLinkGroup = ({
  children,
  activeCondition,
}: SidebarLinkGroupProps) => {
  const [open, setOpen] = useState<boolean>(activeCondition);

  // Open the group when navigation lands on one of its pages (e.g. from a link inside a page)
  useEffect(() => {
    if (activeCondition) setOpen(true);
  }, [activeCondition]);

  const handleClick = () => {
    setOpen(!open);
  };

  return <li>{children(handleClick, open)}</li>;
};

export default SidebarLinkGroup;
