interface midChipSkeletonProps {
  isRed?: boolean;
}

const midChipSkeleton = ({
  isRed = false,
}: midChipSkeletonProps) => {
	return (
		<div className={`h-[30px] py-1 rounded-md w-full border ${isRed ? 'text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-500 dark:border-red-700' : 'text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-600'}`}></div>	
	)
}

export default midChipSkeleton;