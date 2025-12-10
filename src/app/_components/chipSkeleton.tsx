interface chipSkeletonProps {
  isRed?: boolean;
}

const midChipSkeleton = ({
  isRed = false,
}: chipSkeletonProps) => {
	return (
		<div className={`h-[30px] py-1 rounded-md w-full border ${isRed ? 'text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-500 dark:border-red-700' : 'text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-600'}`}></div>	
	)
}

const topLeftChipSkeleton = ({
  isRed = false,
}: chipSkeletonProps) => {
	return (
		<div className={`h-[30px] py-1 rounded-t-2xl md:rounded-tl-2xl md:rounded-tr-md rounded-b-md w-full border ${isRed ? 'text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-500 dark:border-red-700' : 'text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-600'}`}></div>
	)
}

const topRightChipSkeleton = ({
  isRed = false,
}: chipSkeletonProps) => {
	return (
		<div className={`h-[30px] py-1 rounded-t-md md:rounded-tl-md md:rounded-tr-2xl rounded-b-md w-full border ${isRed ? 'text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-500 dark:border-red-700' : 'text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-600'}`}></div>
	)
}

const bottomChipSkeleton = ({
  isRed = false,
}: chipSkeletonProps) => {
	return (
		<div className={`h-[30px] py-1 rounded-b-2xl rounded-t-md w-full col-span-1 md:col-span-2 border ${isRed ? 'text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-500 dark:border-red-700' : 'text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-600'}`}></div>
	)
}

export { midChipSkeleton, topLeftChipSkeleton, topRightChipSkeleton, bottomChipSkeleton };