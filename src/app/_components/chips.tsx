interface chipProps {
  isRed?: boolean;
  child?: React.ReactNode;
  child2?: React.ReactNode;
}

const mainHeader = ({
	child,
	child2,
}: chipProps) => {
	return (
		<h2 className="text-lg font-semibold text-gray-800 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 wrap-break-word transition-colors duration-300 pb-2">
			{child}
		</h2>
	)
}

const topLeftChip = ({
	isRed = false,
	child,
	child2,
}: chipProps) => {
	return (
		<p className={`font-medium px-2 py-1 rounded-t-2xl md:rounded-tl-2xl md:rounded-tr-md rounded-b-md border ${isRed ? 'text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-500 dark:border-red-700' : 'text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-700'}`}>
			{child}
			<span className="text-gray-600 dark:text-gray-400">{child2}</span>
		</p>
	)
}

const topRightChip = ({
	isRed = false,
	child,
	child2,
}: chipProps) => {
	return (
		<p className={`font-medium px-2 py-1 rounded-t-md md:rounded-tl-md md:rounded-tr-2xl rounded-b-md border ${isRed ? 'text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-500 dark:border-red-700' : 'text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-700'}`}>
			{child}
			<span className="text-gray-600 dark:text-gray-400">{child2}</span>
		</p>
	)
}

const midChip = ({
	isRed = false,
	child,
	child2,
}: chipProps) => {
	return (
		<p className={`font-medium px-2 py-1 rounded-md border ${isRed ? 'text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-500 dark:border-red-700' : 'text-indigo-800 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-600'}`}>
			{child}
			<span className="text-gray-600 dark:text-gray-400">{child2}</span>
		</p>
	)
}

const bottomChip = ({
  	isRed = false,
	child,
	child2,
}: chipProps) => {
	return (
		<p className={`font-medium px-2 py-1 rounded-b-2xl rounded-t-md border col-span-1 md:col-span-2 flex items-center justify-center ${isRed ? 'text-red-800 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-500 dark:border-red-700' : 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900 border-indigo-300 dark:border-indigo-600'}`}>
			{child}{child2}
		</p>
	)
}

export { mainHeader, midChip, topLeftChip, topRightChip, bottomChip };