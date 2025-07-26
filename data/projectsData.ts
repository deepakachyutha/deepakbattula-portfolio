interface Project {
  title: string
  description: string
  href?: string
  imgSrc?: string
}

const projectsData: Project[] = [
  {
    title: 'IBM HR Analytics Employees Attrition & Performance',
    description: `A data science project that predicts employee attrition using real-world HR data. Tackles imbalanced datasets using SMOTE and Class Weights, explains predictions with SHAP and Permutation Importance, and evaluates performance with Precision-Recall curves. Built with business level relevance and accuracy.`,
    imgSrc: '/static/images/output.png',
    href: 'https://github.com/deepakachyutha/IBMEmployees-ML',
  },
  {
    title: 'Titanic-ML',
    description: `This Titanic Survical Prediction project applies Supervised Machine Learning to predict passenger survival from the Titanic dataset. It focuses on practical data preprocessing, binary classification, and foundational model evaluation.`,
    imgSrc: '/static/images/titanic.png',
    href: 'https://github.com/deepakachyutha/Titanic-ML',
  },
]

export default projectsData
