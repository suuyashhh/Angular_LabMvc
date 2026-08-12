export interface PortfolioProject {
    projectId: number;
    srNo: number;
    projectName: string;
    projectDescription: string;
    technologies: string;
    codeLink: string;
    liveDemoLink: string;
    apkFile: string;
    desktopFile: string;
    image1: string;
    image2: string;
    image3: string;
    image4: string;
    category: string;
    isActive: boolean;
    createdDate?: string;
    modifiedDate?: string;
}
