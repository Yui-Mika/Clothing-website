import React from "react";

const Title = ({
  title1,
  title2,
  titleStyles,
  title1Styles,
  paraStyles,
  para,
}) => {
  return (
    <div className={`${titleStyles}`}>
      <h3 className={`${title1Styles} text-3xl md:text-4xl font-bold tracking-tight`}>
        {title1}
        <span className="text-gray-400 font-light ml-2">{title2}</span>
      </h3>
      <p className={`${paraStyles} max-w-2xl text-gray-600 text-sm md:text-base mt-3 leading-relaxed`}>
        {para ? para : "Khám phá bộ sưu tập quần áo và giày dép thời trang của chúng tôi, mang lại sự thoải mái, chất lượng và sự tự tin mỗi ngày."}
      </p>
    </div>
  );
};

export default Title;
