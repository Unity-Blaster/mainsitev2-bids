const midChipSkeleton = () => {
	return (
		<div className="h-[30px] py-1 rounded-md w-full border text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-600"></div>	
	)
}

const topLeftChipSkeleton = () => {
	return (
		<div className="h-[30px] py-1 rounded-t-2xl md:rounded-tl-2xl md:rounded-tr-md rounded-b-md w-full border text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-600"></div>
	)
}

const topRightChipSkeleton = () => {
	return (
		<div className="h-[30px] py-1 rounded-t-md md:rounded-tl-md md:rounded-tr-2xl rounded-b-md w-full border text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-600"></div>
	)
}

const bottomChipSkeleton = () => {
	return (
		<div className="h-[30px] py-1 rounded-b-2xl rounded-t-md w-full col-span-1 md:col-span-2 bordertext-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-600"></div>
	)
}

export { midChipSkeleton, topLeftChipSkeleton, topRightChipSkeleton, bottomChipSkeleton };